import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { recordLead, type LeadDraft, type LeadPorts } from "./intake";

type Patch = Parameters<LeadPorts["patchRecord"]>[1];

function fakePorts(over: Partial<LeadPorts> = {}) {
  const calls: string[] = [];
  const patches: Patch[] = [];
  const created: Array<Parameters<LeadPorts["createRecord"]>[0]> = [];
  const mails: Array<Parameters<LeadPorts["sendMail"]>[0]> = [];

  const ports: LeadPorts = {
    async createRecord(input) {
      calls.push("create");
      created.push(input);
      return { id: "42" };
    },
    async patchRecord(_id, patch) {
      calls.push("patch");
      patches.push(patch);
    },
    async sendMail(input) {
      calls.push("mail");
      mails.push(input);
      return { delivered: true };
    },
    async saveAttachment(file) {
      calls.push("attachment");
      return { url: `/uploads/leads/${file.name}`, name: file.name, size: file.size, bytes: Buffer.from("x") };
    },
    ...over
  };

  return { ports, calls, patches, created, mails };
}

const draft: LeadDraft = {
  name: "Анна",
  phone: "+7 (900) 111-22-33",
  telegram: "anna",
  source: "site",
  message: "Столешница\n\nКухня",
  mail: { product: "Столешница", note: "Кухня" }
};

describe("recordLead", () => {
  it("сначала пишет заявку в базу, потом шлёт письмо и отмечает доставку", async () => {
    const { ports, calls, patches, created, mails } = fakePorts();

    const result = await recordLead(ports, draft);

    assert.deepEqual(result, { id: "42", delivered: true });
    assert.deepEqual(calls, ["create", "mail", "patch"]);
    assert.equal(created[0].email, "");
    assert.equal(created[0].telegram, "anna");
    assert.equal(mails[0].note, "Кухня");
    assert.deepEqual(patches, [{ deliveryStatus: "delivered", mailError: undefined }]);
  });

  it("сохраняет вложение до письма и дописывает его в запись", async () => {
    const { ports, calls, patches, mails } = fakePorts();
    const file = new File(["data"], "plan.png", { type: "image/png" });

    await recordLead(ports, draft, file);

    assert.deepEqual(calls, ["create", "attachment", "patch", "mail", "patch"]);
    assert.deepEqual(patches[0], { attachmentUrl: "/uploads/leads/plan.png", attachmentName: "plan.png", attachmentSize: 4 });
    assert.equal(mails[0].attachment?.filename, "plan.png");
  });

  it("не теряет заявку, если письмо не ушло", async () => {
    const { ports, patches } = fakePorts({
      async sendMail() {
        return { delivered: false, reason: "mail-config-missing" };
      }
    });

    const result = await recordLead(ports, draft);

    assert.deepEqual(result, { id: "42", delivered: false });
    assert.deepEqual(patches, [{ deliveryStatus: "failed_mail", mailError: "mail-config-missing" }]);
  });

  it("не роняет приём, если отправка письма бросила исключение", async () => {
    const { ports, patches } = fakePorts({
      async sendMail() {
        throw new Error("smtp down");
      }
    });

    const result = await recordLead(ports, draft);

    assert.deepEqual(result, { id: "42", delivered: false });
    assert.deepEqual(patches, [{ deliveryStatus: "failed_mail", mailError: "mail-send-error" }]);
  });

  it("не пишет в запись и письмо лишние поля у заявки калькулятора", async () => {
    const { ports, created, mails } = fakePorts();

    await recordLead(
      ports,
      { name: "Пётр", phone: "+7 (900) 000-00-00", source: "kalkulyator", message: "Смета", mail: { product: "Смета" }, estimateTotal: 100500 }
    );

    assert.equal("telegram" in created[0], false);
    assert.equal(created[0].estimateTotal, 100500);
    assert.equal("note" in mails[0], false);
    assert.equal("telegram" in mails[0], false);
  });

  it("пробрасывает ошибку сохранения вложения: заявка уже в базе", async () => {
    const { ports, calls } = fakePorts({
      async saveAttachment() {
        throw new Error("disk full");
      }
    });

    await assert.rejects(() => recordLead(ports, draft, new File(["d"], "a.png")), /disk full/);
    assert.deepEqual(calls, ["create"]);
  });
});
