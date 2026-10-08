import { describe, expect, it } from "vitest";
import { bboxOfGeoJson } from "./bbox";

describe("bboxOfGeoJson", () => {
  it("covers a polygon in a FeatureCollection", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[[-52.5, -24.3], [-52.2, -24.3], [-52.2, -23.9], [-52.5, -23.9], [-52.5, -24.3]]],
          },
        },
      ],
    };
    expect(bboxOfGeoJson(geojson)).toEqual({ xmin: -52.5, xmax: -52.2, ymin: -24.3, ymax: -23.9 });
  });

  it("covers every part of a MultiPolygon and applies padding", () => {
    const geojson = {
      features: [
        {
          geometry: {
            type: "MultiPolygon",
            coordinates: [[[[0, 0], [1, 0], [1, 1]]], [[[5, 5], [6, 5], [6, 7]]]],
          },
        },
      ],
    };
    expect(bboxOfGeoJson(geojson, 0.5)).toEqual({ xmin: -0.5, xmax: 6.5, ymin: -0.5, ymax: 7.5 });
  });

  it("returns null when there are no coordinates", () => {
    expect(bboxOfGeoJson({ features: [] })).toBeNull();
    expect(bboxOfGeoJson(null)).toBeNull();
    expect(bboxOfGeoJson({})).toBeNull();
  });
});
