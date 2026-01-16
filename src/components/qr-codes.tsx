import { Document, Font, Page, StyleSheet } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { QRCard } from "./QRCard";

import openSansFont from "../fonts/OpenSans-Regular.ttf";
import notoSansLivingFont from "../fonts/NotoSansLiving-Regular.ttf";

// Register fonts for PDF rendering
Font.register({
  family: "OpenSans",
  fonts: [
    {
      src: openSansFont,
    }
  ]
});

Font.register({
  family: "NotoSansLiving",
  fonts: [
    {
      src: notoSansLivingFont,
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    padding: 10,
    fontFamily: ["OpenSans", "NotoSansLiving"],
  },
});

// Default field labels mapping
const defaultFieldLabels: Record<string, string> = {
    name: "Name",
    internalId: "ID",
    "unit.unit": "Unit",
    "system.name": "System",
    "system.code": "Sys. Code",
    productionYear: "Prod. Year",
    "period.name": "Equip. Period",
    "equipmentStatus.name": "Operational",
    locations: "Locations",
    categories: "Categories",
    suppliers: "Supplier",
    "manufacturer.name": "Manufacturer",
    manufacturerCode: "Part No",
    description: "Description",
    warrantyExpr: "Warranty Exp.",
    critical: "Critical Res.",
    serialNumber: "Ser.No",
    totalQuantity: "Total QTY",
    minQuantity: "Min QTY",
  };

// Default visible columns
const defaultVisibleColumns = [
  "name",
  "internalId",
  "unit",
  "system.name",
  "system.code",
  "productionYear"
];

/**
 * Extract QR text from item data
 */
const getQrText = (item: any): string => {
  return item?.qrCode || item?.barCode || item?.internalId || item?.name || "";
};

/**
 * Generate QR code data URL
 */
const generateQRCode = async (text: string): Promise<string> => {
  if (!text) return "";
  try {
    return await QRCode.toDataURL(text, { width: 256, margin: 1 });
  } catch (err) {
    console.error("QR generation error:", err);
    return "";
  }
};

/**
 * Calculate grid configuration based on items per page
 */
const getGridConfig = (itemsPerPage: number) => {
  let cols = 2;
  let rows = 5;

  switch (itemsPerPage) {
    case 12:
      cols = 2; rows = 6; break;
    case 16:
      cols = 2; rows = 8; break;
    case 18:
      cols = 3; rows = 6; break;
    case 21:
      cols = 3; rows = 7; break;
    case 24:
      cols = 3; rows = 8; break;
    case 27:
      cols = 3; rows = 9; break;
    default:
      cols = 2; rows = 5; // Default 10 items per page
  }

  const widthPerc = 100 / cols;
  const heightPerc = 100 / rows;
  const isDense = cols >= 3 || rows >= 8;
  const fontSize = isDense ? 6 : 8;
  const qrSize = isDense ? 50 : 75;

  return {
    width: `${widthPerc}%`,
    height: `${heightPerc}%`,
    fontSize,
    qrSize,
    itemsPerPage
  };
};

/**
 * Main document component for PDF generation
 */
export const PrintDocument = ({ items, fields, labels, gridConfig }: any) => {
  const orientation = gridConfig.itemsPerPage >= 18 ? "landscape" : "portrait";
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation={orientation}>
        {(items || []).map((item: any, index: number) => (
          <QRCard
            key={index}
            data={item}
            qrCodeUrl={item.qrCodeUrl}
            fields={fields}
            labels={labels}
            gridConfig={gridConfig}
          />
        ))}
      </Page>
    </Document>
  );
};

/**
 * Generate print document with QR codes
 * This is the main function that should be called from the backend
 * 
 * @param data - Raw data object (resource, purchase, or wishlist)
 * @param printType - Type of print: 'resourcePrint', 'purchasePrint', or 'wishlistPrint'
 * @param itemsPerPage - Number of items per page (default: 10)
 * @param fields - Optional custom field configuration
 * @param labels - Optional custom label configuration
 */
export const generatePrintDocument = async (
  data: any,
  printType: string,
  itemsPerPage: number = 10,
  fields?: string[],
  labels?: Record<string, string>
) => {
  // Extract items based on print type
  let items: any[] = [];
  
  if (printType === "purchasePrint") {
    items = data?.itemList?.map((item: any) => item?.resource || item) || [];
  } else if (printType === "wishlistPrint") {
    items = data?.items?.map((item: any) => item?.resource || item) || [];
  } else if (printType === "resourcePrint") {
    items = Array.isArray(data) ? data : [data];
  } else {
    throw new Error(`Invalid print type: ${printType}. Expected 'resourcePrint', 'purchasePrint', or 'wishlistPrint'`);
  }

  // Add QR text to items
  const itemsWithQRText = items.map((item: any) => ({
    ...item,
    qrText: item?.qrText || getQrText(item),
  }));

  // Generate QR codes for all items
  const qrCodeUrls = await Promise.all(
    itemsWithQRText.map(async (item: any) => await generateQRCode(item.qrText))
  );

  // Combine items with generated QR codes
  const itemsWithQRCodes = itemsWithQRText.map((item: any, index: number) => ({
    ...item,
    qrCodeUrl: qrCodeUrls[index],
  }));

  // Get grid configuration
  const gridConfig = getGridConfig(itemsPerPage);

  // Use provided fields and labels or defaults
  const finalFields = fields && fields.length > 0 ? fields : defaultVisibleColumns;
  const finalLabels = labels || defaultFieldLabels;

  // Return the document component
  return (
    <PrintDocument
      items={itemsWithQRCodes}
      fields={finalFields}
      labels={finalLabels}
      gridConfig={gridConfig}
    />
  );
};