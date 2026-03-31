export const searchParamsBreadcrumbsMap: Record<
  string,
  { label: string; getValue?: (value: string) => string }
> = {
  page: {
    label: "Page",
    getValue: (v) => `Page ${v}`,
  },
  q: {
    label: "Search",
  },
};
