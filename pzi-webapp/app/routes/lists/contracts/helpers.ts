export function getSortClause(sorting: { id: string, desc: boolean }[]) {
  const sortParam = sorting.at(0);

  switch (sortParam?.id) {
    case "id": {
      return sortParam.desc
        ? "$orderby=id desc"
        : "$orderby=id";
    }

    case "number": {
      return sortParam.desc
        ? "$orderby=number desc"
        : "$orderby=number";
    }

    case "date": {
      return sortParam.desc
        ? "$orderby=date desc"
        : "$orderby=date";
    }

    case "year": {
      return sortParam.desc
        ? "$orderby=year desc"
        : "$orderby=year";
    }

    default: {
      return '$orderby=date desc';
    }
  }
}

export function getFilterClause(filtering: { id: string, value: string[] | undefined }[]) {
  const filterParts: string[] = [];

  for (const filter of filtering) {
    if (!filter.value || filter.value.length === 0) {
      continue;
    }

    const filterValue = filter.value.at(0);

    switch (filter.id) {
      case 'number': {
        filterParts.push(`startswith(number, '${filterValue}')`);
        break;
      }

      case 'year': {
        filterParts.push(`year eq ${filterValue}`);
        break;
      }

      default: { }
    }
  }

  return filterParts.length == 0
    ? null
    : `$filter=${filterParts.join(' and ')}`;
}
