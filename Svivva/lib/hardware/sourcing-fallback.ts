import type { SourcingResult } from "./sourcing";

type SourcingInput = {
  productName: string;
  productDescription: string;
  category: string;
  materials: string[];
  manufacturingMethod: string;
  budgetRange: number;
};

/**
 * Curated supplier starter list when AI sourcing is unavailable.
 * Gives users actionable next steps instead of a hard error.
 */
export function buildSourcingFallback(data: SourcingInput): SourcingResult {
  const method = data.manufacturingMethod.toLowerCase();
  const category = `${data.category} ${data.productName} ${data.productDescription}`.toLowerCase();
  const isJewelry = /jewel|watch|luxury|diamond|wearable/.test(category);
  const isPcb = /pcb|circuit|sensor|iot|electronics/.test(category);
  const isCnc = method.includes("cnc") || /machin/.test(method);
  const isPrint = method.includes("3d print") || method.includes("prototype");

  const manufacturers = isJewelry
    ? [
        {
          name: "RapidDirect",
          website: "https://www.rapiddirect.com",
          specialty: "Precision CNC + finishing for consumer hardware",
          fit: "Good for luxury wearables and metal assemblies at prototype volumes",
          estimatedCost: "$2,000–$15,000",
          moq: "1–50",
          location: "China / Global",
          leadTime: "2–4 weeks",
        },
        {
          name: "Protolabs",
          website: "https://www.protolabs.com",
          specialty: "Rapid prototyping — CNC, molding, 3D print",
          fit: "Fast iteration on mechanical enclosures and watch-scale parts",
          estimatedCost: "$1,500–$10,000",
          moq: "1",
          location: "USA / EU",
          leadTime: "1–3 weeks",
        },
        {
          name: "Xometry",
          website: "https://www.xometry.com",
          specialty: "On-demand manufacturing marketplace",
          fit: "Compare quotes across CNC, printing, and finishing vendors",
          estimatedCost: "$500–$8,000",
          moq: "1",
          location: "USA / Global network",
          leadTime: "1–2 weeks",
        },
      ]
    : isPcb
      ? [
          {
            name: "JLCPCB",
            website: "https://jlcpcb.com",
            specialty: "PCB fabrication + SMT assembly",
            fit: "Low-cost PCBA for IoT and consumer electronics prototypes",
            estimatedCost: "$50–$2,000",
            moq: "5 boards",
            location: "China",
            leadTime: "1–2 weeks",
          },
          {
            name: "PCBWay",
            website: "https://www.pcbway.com",
            specialty: "PCB + assembly + enclosures",
            fit: "End-to-end electronics prototyping",
            estimatedCost: "$100–$3,000",
            moq: "5",
            location: "China / Global",
            leadTime: "1–3 weeks",
          },
          {
            name: "MacroFab",
            website: "https://www.macrofab.com",
            specialty: "US-based electronics manufacturing",
            fit: "Domestic PCBA when IP or speed to US matters",
            estimatedCost: "$500–$5,000",
            moq: "10",
            location: "USA",
            leadTime: "2–4 weeks",
          },
        ]
      : [
          {
            name: "Xometry",
            website: "https://www.xometry.com",
            specialty: isCnc ? "CNC machining network" : "Multi-process prototyping",
            fit: `Matches ${data.manufacturingMethod || "prototype"} workflows for "${data.productName}"`,
            estimatedCost: "$500–$5,000",
            moq: "1",
            location: "USA / Global",
            leadTime: "1–2 weeks",
          },
          {
            name: "Fictiv",
            website: "https://www.fictiv.com",
            specialty: "Managed manufacturing for startups",
            fit: "Hands-on DFM review and supplier matching",
            estimatedCost: "$1,000–$8,000",
            moq: "1–25",
            location: "USA / Asia partners",
            leadTime: "2–3 weeks",
          },
          {
            name: "Protolabs",
            website: "https://www.protolabs.com",
            specialty: isPrint ? "3D printing + quick-turn molding" : "CNC + molding",
            fit: "Fast first articles before scaling production",
            estimatedCost: "$800–$6,000",
            moq: "1",
            location: "USA / EU",
            leadTime: "1–2 weeks",
          },
        ];

  const materialList =
    data.materials.length > 0 ? data.materials : ["Aluminum", "Plastic (ABS)", "Stainless steel"];

  const materialSuppliers = materialList.slice(0, 3).map((material) => ({
    material,
    supplier: "McMaster-Carr",
    website: "https://www.mcmaster.com",
    priceRange: "Varies by spec — order 1+ units",
  }));

  if (isJewelry && !materialSuppliers.some((s) => /metal|steel|gold/i.test(s.material))) {
    materialSuppliers.push({
      material: "Precious / specialty metals",
      supplier: "Rio Grande",
      website: "https://www.riogrande.com",
      priceRange: "Quote-based",
    });
  }

  const platforms = [
    {
      name: "Alibaba",
      website: "https://www.alibaba.com",
      type: "Marketplace",
      description: "Volume manufacturing and component sourcing at scale",
    },
    {
      name: "Thomasnet",
      website: "https://www.thomasnet.com",
      type: "Supplier directory",
      description: "Find US-based manufacturers by process and certification",
    },
    ...(isPrint
      ? [
          {
            name: "Shapeways",
            website: "https://www.shapeways.com",
            type: "3D print service",
            description: "Consumer-grade 3D printing for early looks-like prototypes",
          },
        ]
      : []),
  ];

  const budget = data.budgetRange.toLocaleString();
  const recommendation = `Starter sourcing pack for "${data.productName}" (budget ~$${budget}). Request quotes from ${manufacturers[0]?.name} and ${manufacturers[1]?.name} first — compare lead time vs. finish quality. AI supplier matching was unavailable; refine materials and MOQ in your blueprint before placing orders.`;

  return {
    manufacturers,
    materialSuppliers,
    platforms,
    recommendation,
  };
}
