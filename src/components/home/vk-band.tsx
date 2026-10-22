import { VK_URL, vk } from "@/content/artellrock";

export function VkBand() {
  return (
    <section className="page block vk-band" aria-labelledby="vk-title">
      <div className="vk-band__text">
        <h2 id="vk-title" className="t-display-md">
          {vk.title}
        </h2>
        <p>{vk.text}</p>
      </div>
      <a className="btn btn--primary" href={VK_URL} target="_blank" rel="noreferrer noopener">
        {vk.button}
      </a>
    </section>
  );
}
