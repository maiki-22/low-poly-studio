"use client";

import { memo } from "react";
import { DetailDialog } from "@/components/ui/detail-dialog";
import type { LineChartSeries } from "./model";

type Props = {
  series: readonly LineChartSeries[];
  categories: readonly string[];
  label: string;
  formatValue: (value: number) => string;
  formatCategory: (value: string) => string;
};
function DataTable({
  series,
  categories,
  label,
  formatValue,
  formatCategory,
}: Props) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={`Tabla: ${label}`}
    >
      <table>
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            {series.map((row) => (
              <th key={row.id} scope="col">
                {row.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category}>
              <th scope="row">{formatCategory(category)}</th>
              {series.map((row) => (
                <td key={row.id}>
                  {row.values[index] == null
                    ? "Sin datos"
                    : formatValue(row.values[index]!)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const LineChartDataTable = memo(function LineChartDataTable(
  props: Props,
) {
  return (
    <DetailDialog
      title="Datos mensuales"
      description={props.label}
      trigger="Ver datos en tabla"
      triggerClassName="chart-data-trigger"
    >
      <DataTable {...props} />
    </DetailDialog>
  );
});
