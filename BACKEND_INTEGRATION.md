# Backend Integration Guide

## Overview

The `src/components/` directory contains production-ready React PDF components for generating QR code labels. This guide explains how to integrate these components into your backend.

## What to Deploy

### Required Files

Copy the following to your backend:

```
src/
├── components/
│   ├── qr-codes.tsx         # Main generator (includes QR logic)
│   ├── QRCard.tsx           # Card component
│   └── README.md            # Component documentation
└── fonts/
    ├── OpenSans-Regular.ttf
    └── NotoSansLiving-Regular.ttf
```

### Required Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.2",
  "qrcode": "^1.5.4",
  "react": "^19.2.0"
}
```

## API Endpoint Design

### Query Parameters

Your backend route should accept these query parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `resourcePrint` | string | ID of resource to print | `?resourcePrint=123` |
| `purchasePrint` | string | ID of purchase order to print | `?purchasePrint=456` |
| `wishlistPrint` | string | ID of wishlist to print | `?wishlistPrint=789` |
| `itemsPerPage` | number | Items per page (default: 10) | `?itemsPerPage=24` |

**Note:** Only one of `resourcePrint`, `purchasePrint`, or `wishlistPrint` should be provided per request.

### Supported Items Per Page

- `10` - 2x5 grid (default)
- `12` - 2x6 grid
- `16` - 2x8 grid
- `18` - 3x6 grid
- `21` - 3x7 grid
- `24` - 3x8 grid
- `27` - 3x9 grid

## Implementation Example

### Node.js/Express Backend

```typescript
import express from 'express';
import { pdf } from '@react-pdf/renderer';
import { generatePrintDocument } from './components/qr-codes';

const app = express();

app.get('/api/print', async (req, res) => {
  try {
    const { resourcePrint, purchasePrint, wishlistPrint, itemsPerPage = 10 } = req.query;
    
    // Validate parameters
    const printTypes = [resourcePrint, purchasePrint, wishlistPrint].filter(Boolean);
    if (printTypes.length === 0) {
      return res.status(400).json({ 
        error: 'One of resourcePrint, purchasePrint, or wishlistPrint is required' 
      });
    }
    if (printTypes.length > 1) {
      return res.status(400).json({ 
        error: 'Only one print type parameter is allowed' 
      });
    }
    
    // Determine print type and fetch data
    let printType: string;
    let data: any;
    
    if (resourcePrint) {
      printType = 'resourcePrint';
      data = await fetchResourceFromDatabase(resourcePrint);
    } else if (purchasePrint) {
      printType = 'purchasePrint';
      data = await fetchPurchaseFromDatabase(purchasePrint);
    } else {
      printType = 'wishlistPrint';
      data = await fetchWishlistFromDatabase(wishlistPrint);
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Generate PDF document
    const document = await generatePrintDocument(
      data,
      printType,
      Number(itemsPerPage)
    );
    
    // Convert to blob
    const pdfBlob = await pdf(document).toBlob();
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    
    // Send as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-labels.pdf"');
    res.send(buffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### NestJS Backend

```typescript
import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { pdf } from '@react-pdf/renderer';
import { generatePrintDocument } from './components/qr-codes';

@Controller('api')
export class PrintController {
  @Get('print')
  async generatePrint(
    @Query('resourcePrint') resourcePrint: string,
    @Query('purchasePrint') purchasePrint: string,
    @Query('wishlistPrint') wishlistPrint: string,
    @Query('itemsPerPage') itemsPerPage: number = 10,
    @Res() res: Response,
  ) {
    try {
      // Validate parameters
      const printTypes = [resourcePrint, purchasePrint, wishlistPrint].filter(Boolean);
      if (printTypes.length !== 1) {
        throw new HttpException(
          'Exactly one print type parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Determine print type and fetch data
      let printType: string;
      let data: any;
      
      if (resourcePrint) {
        printType = 'resourcePrint';
        data = await this.fetchResourceFromDatabase(resourcePrint);
      } else if (purchasePrint) {
        printType = 'purchasePrint';
        data = await this.fetchPurchaseFromDatabase(purchasePrint);
      } else {
        printType = 'wishlistPrint';
        data = await this.fetchWishlistFromDatabase(wishlistPrint);
      }
      
      if (!data) {
        throw new HttpException('Resource not found', HttpStatus.NOT_FOUND);
      }
      
      // Generate PDF document
      const document = await generatePrintDocument(
        data,
        printType,
        Number(itemsPerPage),
      );
      
      // Convert to blob
      const pdfBlob = await pdf(document).toBlob();
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());
      
      // Send as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="qr-labels.pdf"');
      res.send(buffer);
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('PDF generation error:', error);
      throw new HttpException(
        'Failed to generate PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  private async fetchResourceFromDatabase(id: string) {
    // Implement your database fetch logic
  }
  
  private async fetchPurchaseFromDatabase(id: string) {
    // Implement your database fetch logic
  }
  
  private async fetchWishlistFromDatabase(id: string) {
    // Implement your database fetch logic
  }
}
```

## Expected Data Structure

### Resource Print

```typescript
{
  name: string;
  internalId: string;
  qrCode?: string;        // Preferred for QR generation
  barCode?: string;       // Fallback #1
  // internalId is fallback #2
  // name is fallback #3
  unit?: {
    unit: string;
  };
  system?: {
    name: string;
    code: string;
  };
  productionYear?: number;
  // ... other fields
}
```

### Purchase Print

```typescript
{
  itemList: [
    {
      resource: {
        name: string;
        internalId: string;
        // ... same structure as Resource Print
      }
    }
  ]
}
```

### Wishlist Print

```typescript
{
  items: [
    {
      resource: {
        name: string;
        internalId: string;
        // ... same structure as Resource Print
      }
    }
  ]
}
```

## Customization

### Custom Fields

You can customize which fields are displayed by passing a custom fields array:

```typescript
const customFields = [
  "name",
  "internalId",
  "serialNumber",
  "manufacturer.name"
];

const document = await generatePrintDocument(
  data,
  'resourcePrint',
  10,
  customFields  // Custom fields
);
```

### Custom Labels

You can customize field labels by passing a custom labels object:

```typescript
const customLabels = {
  name: "Asset Name",
  internalId: "Asset ID",
  "manufacturer.name": "Maker"
};

const document = await generatePrintDocument(
  data,
  'resourcePrint',
  10,
  undefined,      // Use default fields
  customLabels    // Custom labels
);
```

## Font Configuration

The components use two fonts:
- **OpenSans** - Primary font for Latin characters
- **NotoSansLiving** - Fallback font for Unicode/special characters

Make sure both font files are accessible in your backend environment. The fonts are loaded from `../fonts/` relative to the components directory.

### Bundling with Webpack/Vite

If using a bundler, configure it to handle `.ttf` files:

**Webpack:**
```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  }
};
```

**Vite:**
```javascript
export default {
  assetsInclude: ['**/*.ttf']
};
```

## Testing

### Test Checklist

Before deploying to production:

- [ ] Single resource print works
- [ ] Purchase order with multiple items works
- [ ] Wishlist with various item counts works (10, 12, 16, 18, 21, 24, 27)
- [ ] QR codes are scannable
- [ ] Special characters display correctly
- [ ] Nested object fields work (e.g., "system.name")
- [ ] Array fields format properly
- [ ] PDF prints at correct scale on A4 paper
- [ ] Error handling works for missing data

### Sample Test Requests

```bash
# Test resource print
curl "http://localhost:3000/api/print?resourcePrint=123" -o test-resource.pdf

# Test purchase print with custom items per page
curl "http://localhost:3000/api/print?purchasePrint=456&itemsPerPage=24" -o test-purchase.pdf

# Test wishlist print
curl "http://localhost:3000/api/print?wishlistPrint=789&itemsPerPage=18" -o test-wishlist.pdf
```

## Troubleshooting

### Common Issues

**Issue:** QR codes not generating
- **Solution:** Ensure all items have at least one of: `qrCode`, `barCode`, `internalId`, or `name`

**Issue:** Font not loading
- **Solution:** Check font file paths are correct relative to components directory
- **Solution:** Verify font files have read permissions

**Issue:** PDF generation is slow
- **Solution:** QR code generation is async and can be slow for large datasets. Consider implementing caching or background job processing.

**Issue:** Memory issues with large datasets
- **Solution:** Implement pagination. Generate PDFs in batches if dealing with hundreds of items.

**Issue:** Layout looks broken
- **Solution:** Verify `itemsPerPage` is one of the supported values (10, 12, 16, 18, 21, 24, 27)

## Performance Considerations

- **QR Code Generation:** Each QR code takes ~10-50ms to generate. For 100 items, expect 1-5 seconds.
- **PDF Rendering:** PDF generation takes ~100-500ms depending on complexity.
- **Memory Usage:** Each PDF generation consumes ~10-50MB of memory.

### Optimization Tips

1. **Caching:** Cache generated QR codes by text value
2. **Batch Processing:** For large datasets, process in background jobs
3. **CDN:** Serve fonts from CDN for faster loading (if applicable)
4. **Connection Pooling:** Use connection pooling for database queries

## Support

For issues or questions:
1. Check the component README at `src/components/README.md`
2. Review error logs for specific error messages
3. Verify data structure matches expected format
4. Test with sample data from the test environment

## Frontend Test Environment

The `src/App.tsx` file in this directory demonstrates how to use the components. You can run the test environment with:

```bash
npm install
npm run dev
```

This will start a local development server where you can test PDF generation before deploying to the backend.
