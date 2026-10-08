export interface Bbox {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

type Coordinates = number | Coordinates[];

/** Bounding box of every coordinate in a GeoJSON FeatureCollection/Feature/geometry. */
export function bboxOfGeoJson(geojson: unknown, padding = 0): Bbox | null {
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;

  const visit = (value: Coordinates) => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      const [x, y] = value as [number, number];
      if (x < xmin) xmin = x;
      if (x > xmax) xmax = x;
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
      return;
    }
    for (const child of value) visit(child);
  };

  const root = geojson as {
    features?: Array<{ geometry?: { coordinates?: Coordinates } }>;
    geometry?: { coordinates?: Coordinates };
    coordinates?: Coordinates;
  } | null;

  for (const feature of root?.features ?? []) visit(feature.geometry?.coordinates ?? []);
  visit(root?.geometry?.coordinates ?? []);
  visit(root?.coordinates ?? []);

  if (![xmin, xmax, ymin, ymax].every(Number.isFinite)) return null;
  return {
    xmin: xmin - padding,
    xmax: xmax + padding,
    ymin: ymin - padding,
    ymax: ymax + padding,
  };
}
