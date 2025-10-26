"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Row = {
  id: string;
  name: string;
  price: string; // pack price (₱)
  packQty: string; // pack qty (g)
  need: string; // need (g)
};

type ComputedRow = Row & {
  pricePerGram: number;
  cost: number;
};

type Computations = {
  computedRows: ComputedRow[];
  byId: Map<string, ComputedRow>;
  ingredientsTotal: number;
  overhead: number;
  sub1: number;
  labor: number;
  pack: number;
  total: number;
  perItemIncl: number;
  perItemExcl: number;
  profitBatch: number;
  profitItem: number;
  profitMargin: number;
  recoBatch: number;
  recoItem: number;
  wholesale: number;
  retail: number;
};

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const blankRow = (): Row => ({
  id: genId(),
  name: "",
  price: "",
  packQty: "",
  need: "",
});

const parseNum = (s: string, d = 0) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : d;
};

const fmtCurrency = (n: number) =>
  "₱" +
  (Number.isFinite(n)
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00");

export default function RecipeCostingCalculator() {
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow(), blankRow()]);

  // Rates & batch info
  const [overheadPct, setOverheadPct] = useState("40");
  const [laborPct, setLaborPct] = useState("30");
  const [packagingCost, setPackagingCost] = useState("0");
  const [yieldCount, setYieldCount] = useState("20");

  // Pricing controls
  const [sellPriceBatch, setSellPriceBatch] = useState("800");
  const [targetMargin, setTargetMargin] = useState("20");

  // Markups (ingredients-only base)
  const [whMarkup, setWhMarkup] = useState("25");
  const [rtMarkup, setRtMarkup] = useState("100");

  const computations: Computations = useMemo(() => {
    const computedRows: ComputedRow[] = rows.map((r) => {
      const price = parseNum(r.price);
      const packQty = parseNum(r.packQty);
      const need = parseNum(r.need);

      const pricePerGram = packQty > 0 ? price / packQty : 0;
      const cost = pricePerGram * need;

      return { ...r, pricePerGram, cost };
    });

    const byId = new Map<string, ComputedRow>(
      computedRows.map((r) => [r.id, r])
    );
    const ingredientsTotal = computedRows.reduce((sum, r) => sum + r.cost, 0);

    const overheadRate = Math.max(0, parseNum(overheadPct) / 100);
    const laborRate = Math.max(0, parseNum(laborPct) / 100);
    const pack = Math.max(0, parseNum(packagingCost));
    const y = Math.max(1, parseNum(yieldCount) || 1);

    const overhead = ingredientsTotal * overheadRate;
    const sub1 = ingredientsTotal + overhead;
    const labor = sub1 * laborRate;
    const total = sub1 + labor + pack;

    const perItemIncl = total / y;
    const perItemExcl = ingredientsTotal / y;

    const sell = Math.max(0, parseNum(sellPriceBatch));
    const profitBatch = sell - total;
    const profitItem = profitBatch / y;
    const profitMargin = sell > 0 ? (profitBatch / sell) * 100 : 0;

    const tm = Math.min(0.999, Math.max(0, parseNum(targetMargin) / 100));
    const recoBatch = total / (1 - tm);
    const recoItem = recoBatch / y;

    const whRate = Math.max(0, parseNum(whMarkup) / 100);
    const rtRate = Math.max(0, parseNum(rtMarkup) / 100);
    const wholesale = perItemExcl * (1 + whRate);
    const retail = perItemExcl * (1 + rtRate);

    return {
      computedRows,
      byId,
      ingredientsTotal,
      overhead,
      sub1,
      labor,
      pack,
      total,
      perItemIncl,
      perItemExcl,
      profitBatch,
      profitItem,
      profitMargin,
      recoBatch,
      recoItem,
      wholesale,
      retail,
    };
  }, [
    rows,
    overheadPct,
    laborPct,
    packagingCost,
    yieldCount,
    sellPriceBatch,
    targetMargin,
    whMarkup,
    rtMarkup,
  ]);

  const updateRow = (id: string, field: keyof Row, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => setRows((prev) => [...prev, blankRow()]);
  const clearRows = () => setRows([blankRow(), blankRow(), blankRow()]);
  const deleteRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const loadSample = () => {
    const sample: Row[] = [
      { id: genId(), name: "flour", price: "75", packQty: "1000", need: "420" },
      {
        id: genId(),
        name: "cornstarch",
        price: "20",
        packQty: "100",
        need: "15",
      },
      {
        id: genId(),
        name: "baking soda",
        price: "26",
        packQty: "500",
        need: "5",
      },
      { id: genId(), name: "salt", price: "20", packQty: "1000", need: "2" },
      {
        id: genId(),
        name: "butter",
        price: "183",
        packQty: "227",
        need: "260",
      },
      {
        id: genId(),
        name: "light brown sugar",
        price: "83",
        packQty: "1000",
        need: "220",
      },
      {
        id: genId(),
        name: "white sugar",
        price: "94",
        packQty: "1000",
        need: "120",
      },
      { id: genId(), name: "eggs", price: "10", packQty: "50", need: "70" },
      {
        id: genId(),
        name: "vanilla extract",
        price: "52",
        packQty: "20",
        need: "2",
      },
      {
        id: genId(),
        name: "semisweet chocolate",
        price: "383",
        packQty: "1000",
        need: "300",
      },
      {
        id: genId(),
        name: "cookie pouch",
        price: "42",
        packQty: "100",
        need: "20",
      },
    ];
    setRows(sample);
  };

  const overheadDisplay = `${Math.round(parseNum(overheadPct) * 10) / 10}%`;
  const laborDisplay = `${Math.round(parseNum(laborPct) * 10) / 10}%`;

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Recipe Costing Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter ingredient costs and quantities. All calculations update
          instantly.
        </p>
      </div>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rates & batch info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overheadPct">Overhead / Misc (%)</Label>
              <Input
                id="overheadPct"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={overheadPct}
                onChange={(e) => setOverheadPct(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborPct">Labor (%)</Label>
              <Input
                id="laborPct"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={laborPct}
                onChange={(e) => setLaborPct(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagingCost">
                Packaging cost (per batch) ₱
              </Label>
              <Input
                id="packagingCost"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yieldCount">Yield (items per batch)</Label>
              <Input
                id="yieldCount"
                type="number"
                inputMode="numeric"
                min={1}
                step="1"
                value={yieldCount}
                onChange={(e) => setYieldCount(e.target.value)}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & profit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sellPriceBatch">
                Your selling price (per batch) ₱
              </Label>
              <Input
                id="sellPriceBatch"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={sellPriceBatch}
                onChange={(e) => setSellPriceBatch(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetMargin">Target margin on cost (%)</Label>
              <Input
                id="targetMargin"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
                className="text-right"
              />
            </div>
            <Separator className="sm:col-span-2" />
            <div className="space-y-2">
              <Label htmlFor="whMarkup">
                Wholesale markup on ingredients-only cost (%)
              </Label>
              <Input
                id="whMarkup"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={whMarkup}
                onChange={(e) => setWhMarkup(e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rtMarkup">
                Retail markup on ingredients-only cost (%)
              </Label>
              <Input
                id="rtMarkup"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={rtMarkup}
                onChange={(e) => setRtMarkup(e.target.value)}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Ingredients</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={addRow}>
              + Add ingredient
            </Button>
            <Button size="sm" variant="outline" onClick={clearRows}>
              Clear all
            </Button>
            <Button size="sm" variant="outline" onClick={loadSample}>
              Load sample
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="-mx-4 sm:mx-0 overflow-x-auto rounded-md border">
            <Table className="min-w-[820px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead className="min-w-[180px]">Ingredient</TableHead>
                  <TableHead className="text-right">Pack price (₱)</TableHead>
                  <TableHead className="text-right">Pack qty (g)</TableHead>
                  <TableHead className="text-right">
                    Need in recipe (g)
                  </TableHead>
                  <TableHead className="text-right">Price / g (₱)</TableHead>
                  <TableHead className="text-right">Cost (₱)</TableHead>
                  <TableHead className="w-[56px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const cr = computations.byId.get(r.id);
                  return (
                    <TableRow key={r.id} className="h-12">
                      <TableCell>
                        <Input
                          value={r.name}
                          onChange={(e) =>
                            updateRow(r.id, "name", e.target.value)
                          }
                          placeholder="e.g., flour"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          className="text-right"
                          value={r.price}
                          onChange={(e) =>
                            updateRow(r.id, "price", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          className="text-right"
                          value={r.packQty}
                          onChange={(e) =>
                            updateRow(r.id, "packQty", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          className="text-right"
                          value={r.need}
                          onChange={(e) =>
                            updateRow(r.id, "need", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtCurrency(cr?.pricePerGram ?? 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtCurrency(cr?.cost ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteRow(r.id)}
                          aria-label="Delete row"
                          title="Delete row"
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-medium">
                    Ingredients total
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtCurrency(computations.ingredientsTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Pack qty is the weight purchased (e.g., 1000 g). “Need in
            recipe” is how much the recipe uses.
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <RowItem
              label="Ingredients total"
              value={fmtCurrency(computations.ingredientsTotal)}
            />
            <RowItem
              label={`Overhead (${overheadDisplay})`}
              value={fmtCurrency(computations.overhead)}
            />
            <RowItem
              label="Subtotal (ingredients + overhead)"
              value={fmtCurrency(computations.sub1)}
            />
            <RowItem
              label={`Labor (${laborDisplay})`}
              value={fmtCurrency(computations.labor)}
            />
            <RowItem label="Packaging" value={fmtCurrency(computations.pack)} />
            <Separator />
            <RowItem
              label="Total cost (per batch)"
              value={fmtCurrency(computations.total)}
              bold
            />
            <RowItem
              label="Cost per item (incl. overhead & labor)"
              value={fmtCurrency(computations.perItemIncl)}
            />
            <RowItem
              label="Cost per item (ingredients only)"
              value={fmtCurrency(computations.perItemExcl)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <RowItem
              label="Profit (batch) at your price"
              value={fmtCurrency(computations.profitBatch)}
            />
            <RowItem
              label="Profit (per item) at your price"
              value={fmtCurrency(computations.profitItem)}
            />
            <RowItem
              label="Profit margin at your price"
              value={`${(Number.isFinite(computations.profitMargin)
                ? computations.profitMargin
                : 0
              ).toFixed(2)}%`}
            />
            <Separator />
            <RowItem
              label="Recommended selling price (batch)"
              value={fmtCurrency(computations.recoBatch)}
            />
            <RowItem
              label="Recommended selling price (per item)"
              value={fmtCurrency(computations.recoItem)}
            />
            <Separator />
            <RowItem
              label="Wholesale price (per item)"
              value={fmtCurrency(computations.wholesale)}
            />
            <RowItem
              label="Retail price (per item)"
              value={fmtCurrency(computations.retail)}
            />
            <p className="text-xs text-muted-foreground">
              Wholesale/Retail use ingredients-only cost per item as the base.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        All calculations run locally in your browser.
      </p>
    </div>
  );
}

function RowItem({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? "font-semibold" : ""
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="tabular-nums ml-2">{value}</span>
    </div>
  );
}
