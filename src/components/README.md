# QR Code Print Template Components

This directory contains production-ready components for generating QR code labels in PDF format.

## Overview

These components use `@react-pdf/renderer` to generate printable PDF documents with QR codes. They are designed to be used on the backend to generate PDF blobs that can be sent to clients.

## Files

- **`qr-codes.tsx`** - Main document generator with QR code logic
- **`QRCard.tsx`** - Individual card component for rendering QR code labels
- **`README.md`** - This file

## Required Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.2",
  "qrcode": "^1.5.4",
  "react": "^19.2.0"
}
```

## Required Fonts

The components require the following font files in the `../fonts/` directory:
- `OpenSans-Regular.ttf`
- `NotoSansLiving-Regular.ttf`

Make sure these fonts are available in the backend environment.

## Usage

### Main Function: `generatePrintDocument`

```typescript
import { generatePrintDocument } from './components/qr-codes';
import { pdf } from '@react-pdf/renderer';

// Generate PDF document
const document = await generatePrintDocument(
  data,           // Raw data object
  printType,      // 'resourcePrint', 'purchasePrint', or 'wishlistPrint'
  itemsPerPage,   // Number of items per page (default: 10)
  fields,         // Optional: custom field array
  labels          // Optional: custom label mapping
);

// Convert to blob
const blob = await pdf(document).toBlob();

// Return blob to client
return blob;
```

## Query Parameters

The backend route should accept the following query parameters:

- **`resourcePrint`** - Generate PDF for a single resource
- **`purchasePrint`** - Generate PDF for purchase order items
- **`wishlistPrint`** - Generate PDF for wishlist items
- **`itemsPerPage`** - Number of items per page (default: 10)

### Supported Items Per Page

- `10` - 2x5 grid (default)
- `12` - 2x6 grid
- `16` - 2x8 grid
- `18` - 3x6 grid
- `21` - 3x7 grid
- `24` - 3x8 grid
- `27` - 3x9 grid

## Data Structure

### Expected Input Format

#### Resource Print
```typescript
{
  name: string;
  internalId: string;
  qrCode?: string;       // Optional: QR code text
  barCode?: string;      // Fallback for QR code
  // ... other fields
}
```

#### Purchase Print
```typescript
{
  itemList: [
    {
      resource: {
        name: string;
        internalId: string;
        // ... other fields
      }
    }
  ]
}
```

#### Wishlist Print
```typescript
{
  items: [
    {
      resource: {
        name: string;
        internalId: string;
        // ... other fields
      }
    }
  ]
}
```

## Default Configuration

### Default Visible Fields
```typescript
[
  "name",
  "internalId",
  "unit",
  "system.name",
  "system.code",
  "productionYear"
]
```

### Default Field Labels
```typescript
{
  name: "Name",
  internalId: "ID",
  "unit.unit": "Unit",
  "system.name": "System Name",
  "system.code": "System Code",
  productionYear: "Production year",
  "period.name": "Equipment Period",
  "equipmentStatus.name": "Operational",
  locations: "Locations",
  categories: "Categories",
  suppliers: "Supplier",
  "manufacturer.name": "Manufacturer",
  manufacturerCode: "Part No",
  description: "Description",
  warrantyExpr: "Warranty Expiry",
  critical: "Critical Resource",
  serialNumber: "Serial Number",
  totalQuantity: "Total QTY",
  minQuantity: "Min QTY"
}
```

## Backend Implementation Example

```typescript
import { pdf } from '@react-pdf/renderer';
import { generatePrintDocument } from './components/qr-codes';

app.get('/api/print', async (req, res) => {
  try {
    const { resourcePrint, purchasePrint, wishlistPrint, itemsPerPage = 10 } = req.query;
    
    // Determine print type
    let printType: string;
    let data: any;
    
    if (resourcePrint) {
      printType = 'resourcePrint';
      data = await fetchResourceData(resourcePrint);
    } else if (purchasePrint) {
      printType = 'purchasePrint';
      data = await fetchPurchaseData(purchasePrint);
    } else if (wishlistPrint) {
      printType = 'wishlistPrint';
      data = await fetchWishlistData(wishlistPrint);
    } else {
      return res.status(400).json({ error: 'Missing print type parameter' });
    }
    
    // Generate document
    const document = await generatePrintDocument(
      data,
      printType,
      Number(itemsPerPage)
    );
    
    // Convert to blob
    const blob = await pdf(document).toBlob();
    
    // Send blob to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-labels.pdf"');
    res.send(Buffer.from(await blob.arrayBuffer()));
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
```

## Features

- ✅ Automatic QR code generation from item data
- ✅ Dynamic grid layouts (2-3 columns, 5-9 rows)
- ✅ Responsive font and QR code sizing
- ✅ Support for nested object paths (e.g., "system.name")
- ✅ Array value formatting
- ✅ Text truncation for long values
- ✅ Unicode support via NotoSansLiving font
- ✅ Professional styling with borders and proper spacing

## Notes

- QR codes are automatically generated from `qrCode`, `barCode`, `internalId`, or `name` fields (in that priority order)
- The components handle nested data structures using dot notation (e.g., "system.name")
- Arrays are automatically formatted as comma-separated values
- Text longer than 56 characters is truncated with ellipsis
- Grid layouts automatically adjust font size and QR code size for optimal fit
- The first field value is displayed in bold for emphasis

## Testing

Before deploying to production, test with:
1. Single resource print
2. Purchase order with multiple items
3. Wishlist with maximum items per page (27)
4. Data with special characters and Unicode
5. Data with nested objects and arrays

## Troubleshooting

**QR codes not generating:**
- Ensure `qrcode` package is installed
- Check that items have valid `qrCode`, `barCode`, `internalId`, or `name` fields

**Font rendering issues:**
- Verify font files are in the correct path (`../fonts/`)
- Check font file permissions on the backend server

**Layout issues:**
- Verify `itemsPerPage` is one of the supported values
- Check that `gridConfig` is being passed correctly

**PDF generation fails:**
- Ensure all required dependencies are installed
- Check for console errors during QR code generation
- Verify data structure matches expected format
