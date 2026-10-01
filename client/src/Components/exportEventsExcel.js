import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportEventsToExcel = async (events, user, activeCampusFilter = "All") => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Community Events", {
    views: [{ showGridLines: true }],
  });

  // Set column widths matching the target sheet
  worksheet.columns = [
    { key: "campus", width: 16 },
    { key: "name", width: 32 },
    { key: "desc", width: 34 },
    { key: "date", width: 20 },
    { key: "contact", width: 28 },
    { key: "sponsors", width: 24 },
  ];

  const todayStr = new Date().toLocaleDateString("en-US");
  const userName = user?.fullName || "Member";

  // --- Row 1: Title Banner ---
  worksheet.mergeCells("A1:F1");
  const titleRow = worksheet.getCell("A1");
  titleRow.value = "GDG AAUP — Events & Sponsorship Management";
  titleRow.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF202124" },
  };
  titleRow.alignment = { vertical: "middle", indent: 1 };
  worksheet.getRow(1).height = 36;

  // --- Row 2: Sub-info Banner ---
  worksheet.mergeCells("A2:F2");
  const infoRow = worksheet.getCell("A2");
  infoRow.value = `Campus: ${activeCampusFilter}  |  Exported: ${todayStr} by ${userName}`;
  infoRow.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF5F6368" } };
  infoRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" },
  };
  infoRow.alignment = { vertical: "middle", indent: 1 };
  worksheet.getRow(2).height = 22;

  let currentRowIndex = 4;

  events.forEach((ev) => {
    // --- Event Header Row ---
    const eventRow = worksheet.getRow(currentRowIndex);
    eventRow.height = 28;

    const sponsorCount = ev.sponsors?.length || 0;

    eventRow.getCell(1).value = (ev.campus || "RAMALLAH").toUpperCase();
    eventRow.getCell(2).value = ev.name || "Untitled Event";
    eventRow.getCell(3).value = ev.description || "";
    eventRow.getCell(4).value = `📅 ${ev.date || "Unspecified"}`;
    eventRow.getCell(5).value = "";
    eventRow.getCell(6).value = `${sponsorCount} Sponsor(s)`;

    // Google Green header styling
    for (let col = 1; col <= 6; col++) {
      const cell = eventRow.getCell(col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F9D58" },
      };
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF0B8043" } },
        bottom: { style: "thin", color: { argb: "FF0B8043" } },
      };
    }

    currentRowIndex++;

    if (!ev.sponsors || ev.sponsors.length === 0) {
      // Empty sponsor row
      const emptyRow = worksheet.getRow(currentRowIndex);
      emptyRow.height = 22;
      emptyRow.getCell(2).value = "   (No sponsors recorded yet)";
      emptyRow.getCell(2).font = { name: "Arial", size: 10, italic: true, color: { argb: "FF80868B" } };
      emptyRow.getCell(4).value = "-";
      emptyRow.getCell(5).value = "-";
      emptyRow.getCell(6).value = "-";

      for (let col = 1; col <= 6; col++) {
        const cell = emptyRow.getCell(col);
        cell.alignment = { vertical: "middle" };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE0E4E8" } } };
      }

      currentRowIndex += 2; // Leave a space before the next event
      return;
    }

    // --- Sponsor Table Sub-header ---
    const spHeaderRow = worksheet.getRow(currentRowIndex);
    spHeaderRow.height = 22;
    spHeaderRow.getCell(2).value = "Sponsor Organization";
    spHeaderRow.getCell(4).value = "Status";
    spHeaderRow.getCell(5).value = "Contact";
    spHeaderRow.getCell(6).value = "Added By";

    [2, 4, 5, 6].forEach((col) => {
      const cell = spHeaderRow.getCell(col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F0FE" },
      };
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1A73E8" } };
      cell.alignment = { vertical: "middle" };
    });

    currentRowIndex++;

    // --- Sponsor Rows ---
    ev.sponsors.forEach((sp, idx) => {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 22;

      row.getCell(2).value = `  • ${sp.name}`;
      row.getCell(4).value = sp.status || "Suggestion";
      row.getCell(5).value = sp.contact || "-";
      row.getCell(6).value = sp.addedBy || "Member";

      const zebraBg = idx % 2 === 0 ? "FFFFFFFF" : "FFF9FBFD";

      // Status pill coloring
      let statusFg = "FF5F6368";
      let statusBg = "FFF1F3F4";

      if (sp.status === "Approved") {
        statusFg = "FF137333";
        statusBg = "FFE6F4EA";
      } else if (sp.status === "Rejected" || sp.status === "No Response") {
        statusFg = "FFC5221F";
        statusBg = "FFFCE8E6";
      } else if (sp.status === "Awaiting Response") {
        statusFg = "FFB06000";
        statusBg = "FFFEF7E0";
      }

      for (let col = 1; col <= 6; col++) {
        const cell = row.getCell(col);
        cell.alignment = { vertical: "middle" };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE8EAED" } } };

        if (col === 4) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg } };
          cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: statusFg } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: zebraBg } };
          cell.font = { name: "Arial", size: 10, color: { argb: "FF202124" } };
        }
      }

      currentRowIndex++;
    });

    currentRowIndex++; // Blank line between events
  });

  // Export buffer to file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileDate = new Date().toISOString().split("T")[0];
  saveAs(new Blob([buffer]), `GDG_AAUP_Events_${activeCampusFilter}_${fileDate}.xlsx`);
};