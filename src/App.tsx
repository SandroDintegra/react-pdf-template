import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { generatePrintDocument } from "./components/qr-codes";
import "./App.css";
import configuration from "../configuration.json";
import resourceData from "../resource.json";
import purchaseData from "../purchase.json";
import wishlistData from "../wishlist.json";

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [printType, setPrintType] = useState("wishlist");
  // State for wishlist items per page selection
  const [wishlistCount, setWishlistCount] = useState(10);

  const resourceSource: any = resourceData;
  const purchaseSource: any = purchaseData;
  const wishlistSource: any = wishlistData;

  // Configuration for wishlist layouts
  const wishlistLayoutOptions = [
    { label: "12 per page", value: 12 },
    { label: "16 per page", value: 16 },
    { label: "18 per page", value: 18 },
    { label: "21 per page", value: 21 },
    { label: "24 per page", value: 24 },
    { label: "27 per page", value: 27 },
  ];

  const fieldLabels = {
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

  const visibleColumns = configuration?.visibleColumns || [];

  // Map frontend type names to backend-compatible names
  const getPrintTypeParam = (type: string) => {
    if (type === "resource") return "resourcePrint";
    if (type === "purchase") return "purchasePrint";
    if (type === "wishlist") return "wishlistPrint";
    return "resourcePrint";
  };

  // Get data source based on print type
  const getDataSource = (type: string) => {
    if (type === "purchase") return purchaseSource;
    if (type === "wishlist") return wishlistSource;
    return resourceSource;
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      // Get data and parameters
      const data = getDataSource(printType);
      const printTypeParam = getPrintTypeParam(printType);
      const itemsPerPage = printType === "wishlist" ? wishlistCount : 10;

      // Generate document using the backend-ready function
      const document = await generatePrintDocument(
        data,
        printTypeParam,
        itemsPerPage,
        visibleColumns,
        fieldLabels
      );

      // Convert to blob
      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        const link = window.document.createElement("a");
        link.href = url;
        link.download = "qr-codes.pdf";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        alert("PDF downloaded. Please open the downloaded file and print it.");
      }

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>QR Code Generator</h1>
        <p>Generate and print QR code labels</p>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <select
            value={printType}
            onChange={(event) => {
              setPrintType(event.target.value);
              // Reset wishlist count to default when switching types if needed, 
              // or keep user preference.
            }}
            disabled={isGenerating}
            style={{
              padding: "8px 12px",
              fontSize: "14px",
            }}
          >
            <option value="resource">Resource</option>
            <option value="purchase">Purchase</option>
            <option value="wishlist">Wishlist</option>
          </select>

          {/* Additional Dropdown only for Wishlist */}
          {printType === "wishlist" && (
            <select
              value={wishlistCount}
              onChange={(e) => setWishlistCount(Number(e.target.value))}
              disabled={isGenerating}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
              }}
            >
              {wishlistLayoutOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handlePrint}
          disabled={isGenerating}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? "Generating PDF..." : "Print QR Codes"}
        </button>
      </header>
    </div>
  );
}

export default App;