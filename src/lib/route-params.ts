export type IdRouteParams = Promise<{ id: string }>;

export async function getRouteId(params: IdRouteParams) {
  return (await params).id;
}
