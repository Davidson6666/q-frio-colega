/**
 * Applies a user-pinned theme before first paint to avoid a flash of the wrong
 * theme. Without a pinned choice it does nothing and CSS follows the system.
 * Rendered as a plain inline script on purpose (not module, not deferred).
 */
const script = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute("content",t)}}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
