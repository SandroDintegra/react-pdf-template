import { Text, View, StyleSheet, Image } from "@react-pdf/renderer";

/**
 * QRCard Component
 * Renders a single QR code card with item details
 * Used for generating printable PDF labels
 */

/**
 * Create dynamic styles based on grid configuration
 * Adjusts card dimensions, font sizes, and QR code sizes
 */
const getDynamicStyles = (gridConfig: any) => StyleSheet.create({
  cardContainer: {
    width: gridConfig.width,
    height: gridConfig.height,
  },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: "100%",
    width: "100%",
    overflow: "hidden"
  },
  leftSection: {
    width: "30%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 1,
    paddingVertical: 2,
  },
  rightSection: {
    width: "70%",
    paddingTop: 2,
    paddingRight: 2,
    paddingBottom: 2,
    paddingLeft: 2,
    justifyContent: "space-evenly",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  label: {
    fontSize: gridConfig.fontSize,
    color: "#707070ff",
    width: "25%",
    flexShrink: 0,
    paddingRight: 2,
  },
  value: {
    fontSize: gridConfig.fontSize,
    color: "#000",
    width: "75%",
    flexShrink: 1,
    flexWrap: "wrap",
    maxLines: 2,
    textOverflow: "ellipsis",
  },
  boldValue: {
    fontSize: gridConfig.fontSize,
    color: "#000",
    fontWeight: "bold",
    width: "75%",
    flexShrink: 1,
    flexWrap: "wrap",
    maxLines: 2,
    textOverflow: "ellipsis",
  },
  qrImage: {
    width: gridConfig.qrSize,
    height: gridConfig.qrSize,
  },
  qrText: {
    fontSize: Math.max(gridConfig.fontSize - 1, 5),
    textAlign: "left",
    fontWeight: "bold",
    marginTop: 2,
    maxLines: 2,
    textOverflow: "ellipsis",
  },
  logoText: {
    fontSize: gridConfig.fontSize,
    fontWeight: "bold",
  },
  titleDot: {
    fontSize: gridConfig.fontSize * 1.5,
    fontWeight: "bold",
    color: "orange",
  },
});

/**
 * Truncate text to fit within two lines
 */
const truncateToTwoLines = (text: string, maxChars: number = 56): string => {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars).trim() + "...";
};

/**
 * Extract display value from object (name, code, unit, or internalId)
 */
const getObjectDisplayValue = (value: any): string => {
  if (!value || typeof value !== "object") return "";
  if (typeof value.name === "string" && value.name.trim()) return value.name;
  if (typeof value.code === "string" && value.code.trim()) return value.code;
  if (typeof value.unit === "string" && value.unit.trim()) return value.unit;
  if (typeof value.internalId === "string" && value.internalId.trim())
    return value.internalId;
  return "";
};

/**
 * Extract values from nested object paths (e.g., "system.name")
 */
const extractValues = (value: any, segments: string[]): any[] => {
  if (segments.length === 0) return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractValues(item, segments));
  }
  if (value && typeof value === "object") {
    return extractValues(value[segments[0]], segments.slice(1));
  }
  return [];
};

/**
 * Format value for display (handles arrays, objects, booleans)
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === "boolean") return item ? "Yes" : "No";
        if (item && typeof item === "object") {
          const display = getObjectDisplayValue(item);
          return display || "";
        }
        return item !== null && item !== undefined ? String(item) : "";
      })
      .filter((item) => item);
    return parts.join(", ");
  }
  if (typeof value === "object") {
    const display = getObjectDisplayValue(value);
    return display || "";
  }
  return String(value);
};

/**
 * Get field value from data using dot notation path
 */
const getFieldValue = (data: any, fieldPath: string): string => {
  const segments = fieldPath.split(".");
  const values = extractValues(data, segments);
  const parts = values
    .map((value: any) => formatValue(value))
    .filter((value: any) => value);
  return parts.join(", ");
};

/**
 * QRCard component props
 */
interface QRCardProps {
  qrCodeUrl: string;
  data: any;
  fields: string[];
  labels: Record<string, string>;
  gridConfig: {
    width: string;
    height: string;
    fontSize: number;
    qrSize: number;
  };
}

/**
 * QRCard Component
 * Renders a single card with QR code and item details
 */
export const QRCard = ({ qrCodeUrl, data, fields, labels, gridConfig }: QRCardProps) => {
  const config = gridConfig || { width: "50%", height: "20%", fontSize: 8, qrSize: 75 };
  const styles = getDynamicStyles(config);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <Text style={styles.logoText}>
            SUPER<Text style={styles.titleDot}>.</Text>
          </Text>
          {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrImage} />}
          <Text style={styles.qrText}>
            {String(data?.qrText || "")
              .split("")
              .map((char, idx) => (
                <Text key={idx}>{char}</Text>
              ))}
          </Text>
        </View>
        <View style={styles.rightSection}>
          {(fields || []).map((field: string, index: number) => {
            const label = labels?.[field] || field;
            const rawValue = getFieldValue(data, field);
            const displayValue = rawValue && String(rawValue).trim() 
              ? truncateToTwoLines(String(rawValue).trim()) 
              : "N/A";

            return (
              <View key={field} style={styles.row}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={index === 0 ? styles.boldValue : styles.value}>
                  {displayValue}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};