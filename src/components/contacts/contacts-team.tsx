import Image from "next/image";

import { toTelHref } from "@/lib/company-phones";
import type { TeamMember } from "@/types/content";

import styles from "./contacts-page.module.scss";

const teamPhonesByName: Record<string, string> = {
  "Виталий Смирнов": "+7 (965) 012-30-74",
  "Александр Попов": "+7 (999) 219-41-28"
};

const displayFirstName: Record<string, string> = {
  "Виталий Смирнов": "Виталий",
  "Александр Попов": "Александр"
};

type ContactsTeamProps = {
  members: TeamMember[];
};

export function ContactsTeam({ members }: ContactsTeamProps) {
  if (!members.length) {
    return null;
  }

  return (
    <div>
      <h2 className={styles.blockTitle}>С кем вы свяжетесь</h2>
      <p className={styles.teamIntro}>
        За ArtellRock — двое специалистов: от первого звонка до производства и монтажа.
      </p>
      <div className={styles.teamGrid}>
        {members.map((member) => {
          const phone = teamPhonesByName[member.name];
          const firstName = displayFirstName[member.name] ?? member.name.split(" ")[0];

          return (
            <article key={member.id} className={styles.teamCard}>
              <div className={styles.teamPhoto}>
                <Image
                  src={member.image || "/images/quartz-surface-light.svg"}
                  alt={member.name}
                  fill
                  sizes="(max-width: 519px) 100vw, 280px"
                />
              </div>
              <div className={styles.teamBody}>
                <h3 className={styles.teamName}>{firstName}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                {phone ? (
                  <a className={styles.teamPhone} href={toTelHref(phone)}>
                    {phone}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
