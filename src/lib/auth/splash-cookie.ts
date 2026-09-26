/**
 * The splash screen's "already seen" flag.
 *
 * A cookie rather than `sessionStorage`, and the reason is the flash: the
 * server has to be able to decide whether the splash belongs in the response.
 * A splash decided in an effect is necessarily absent from the server-rendered
 * HTML, so the browser paints the finished dashboard and *then* covers it — a
 * worse experience than having no splash at all.
 *
 * Written from the client with `document.cookie` on dismissal. That is normally
 * the wrong instinct, but this flag gates nothing but a decoration, and routing
 * it through a server action would spend a round trip on a visual.
 */
export const SPLASH_COOKIE = "itikq_splash_seen";

/** Six hours: once per working session, and a fresh hello the next day. */
export const SPLASH_COOKIE_MAX_AGE = 6 * 60 * 60;
