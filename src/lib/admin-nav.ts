export type AdminNavRoute = {
  href: string;
  exact?: boolean;
};

/**
 * Select one active sidebar route. Nested routes win over their parents so
 * `/admin/stories/pending` does not also highlight `/admin/stories`.
 */
export function resolveActiveAdminHref(
  pathname: string,
  routes: readonly AdminNavRoute[],
) {
  return routes
    .filter((route) =>
      route.exact
        ? pathname === route.href
        : pathname === route.href || pathname.startsWith(`${route.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
