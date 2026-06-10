// Realistic procurement demo data for ProcureAI

export type RequestStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "In RFQ"
  | "Rejected"

export type RfqStatus = "Open" | "Closing Soon" | "Closed" | "Awarded"
export type VendorStatus = "Active" | "Under Review" | "Inactive"
export type PoStatus = "Draft" | "Issued" | "Acknowledged" | "Delivered" | "Cancelled"

export interface PurchaseRequest {
  id: string
  title: string
  department: string
  budget: number
  status: RequestStatus
  createdDate: string
  requiredDate: string
  requester: string
  businessNeed: string
  category: string
  attachments: { name: string; size: string }[]
}

export interface Vendor {
  id: string
  name: string
  category: string
  rating: number
  leadTime: string
  performanceScore: number
  aiScore: number
  status: VendorStatus
  location: string
  contact: { name: string; email: string; phone: string }
  spend: number
  orders: number
  onTimeDelivery: number
  documents: { name: string; type: string; date: string }[]
}

export interface Rfq {
  id: string
  number: string
  title: string
  requestLinked: string
  vendorsInvited: number
  vendorsResponded: number
  closingDate: string
  status: RfqStatus
  category: string
  estimatedValue: number
}

export interface PurchaseOrder {
  id: string
  number: string
  vendor: string
  amount: number
  status: PoStatus
  issuedDate: string
  expectedDelivery: string
  items: { name: string; qty: number; unitPrice: number }[]
}

export interface QuoteLine {
  vendor: string
  unitPrice: number
  deliveryDays: number
  warranty: string
  totalCost: number
  paymentTerms: string
  riskLevel: "Low" | "Medium" | "High"
}

export const kpis = {
  totalVendors: 248,
  totalVendorsDelta: 12,
  pendingRequests: 37,
  pendingRequestsDelta: -8,
  activeRfqs: 19,
  activeRfqsDelta: 4,
  savings: 2480000,
  savingsDelta: 18.4,
}

export const spendByCategory = [
  { category: "IT Hardware", spend: 1840000 },
  { category: "Software Licenses", spend: 1320000 },
  { category: "Office Furniture", spend: 540000 },
  { category: "Networking", spend: 760000 },
  { category: "Manufacturing", spend: 2100000 },
  { category: "Logistics", spend: 480000 },
]

export const monthlyTrend = [
  { month: "Jan", spend: 620000, savings: 84000 },
  { month: "Feb", spend: 710000, savings: 96000 },
  { month: "Mar", spend: 680000, savings: 102000 },
  { month: "Apr", spend: 790000, savings: 128000 },
  { month: "May", spend: 850000, savings: 164000 },
  { month: "Jun", spend: 920000, savings: 198000 },
  { month: "Jul", spend: 880000, savings: 186000 },
  { month: "Aug", spend: 960000, savings: 224000 },
]

export const vendorPerformance = [
  { name: "Dell Technologies", score: 94 },
  { name: "Cisco Systems", score: 91 },
  { name: "Steelcase", score: 88 },
  { name: "Lenovo Group", score: 85 },
  { name: "HP Enterprise", score: 82 },
]

export const purchaseRequests: PurchaseRequest[] = [
  {
    id: "pr-1",
    title: "120x Engineering Laptops (Dell XPS 15)",
    department: "Engineering",
    budget: 264000,
    status: "In RFQ",
    createdDate: "2026-05-28",
    requiredDate: "2026-07-15",
    requester: "Priya Sharma",
    category: "IT Hardware",
    businessNeed:
      "Refresh aging developer workstations to support the new ML training workloads. Current 4-year-old laptops cannot handle local model fine-tuning and are causing productivity loss across the platform teams.",
    attachments: [
      { name: "device-specifications.pdf", size: "248 KB" },
      { name: "team-headcount-q3.xlsx", size: "62 KB" },
    ],
  },
  {
    id: "pr-2",
    title: "Annual Adobe Creative Cloud Renewal (85 seats)",
    department: "Marketing",
    budget: 51000,
    status: "Pending Approval",
    createdDate: "2026-06-02",
    requiredDate: "2026-06-30",
    requester: "Marcus Webb",
    category: "Software Licenses",
    businessNeed:
      "Renewal of Adobe Creative Cloud enterprise agreement covering the brand, content, and design teams. Includes negotiated volume discount and shared cloud storage upgrade.",
    attachments: [{ name: "adobe-quote-2026.pdf", size: "180 KB" }],
  },
  {
    id: "pr-3",
    title: "Ergonomic Standing Desks — HQ Floor 4",
    department: "Facilities",
    budget: 96000,
    status: "Approved",
    createdDate: "2026-05-19",
    requiredDate: "2026-08-01",
    requester: "Elena Rodriguez",
    category: "Office Furniture",
    businessNeed:
      "Outfit the newly leased 4th floor with 80 height-adjustable standing desks and ergonomic chairs as part of the wellbeing initiative and upcoming team relocation.",
    attachments: [
      { name: "floor-plan-l4.pdf", size: "1.2 MB" },
      { name: "ergonomics-policy.pdf", size: "94 KB" },
    ],
  },
  {
    id: "pr-4",
    title: "Core Network Switch Upgrade (Datacenter East)",
    department: "IT Infrastructure",
    budget: 312000,
    status: "Pending Approval",
    createdDate: "2026-06-05",
    requiredDate: "2026-09-10",
    requester: "David Chen",
    category: "Networking",
    businessNeed:
      "Replace end-of-life Catalyst switches with 400G-capable hardware to remove the throughput bottleneck affecting storage replication and customer-facing latency.",
    attachments: [{ name: "network-topology.pdf", size: "520 KB" }],
  },
  {
    id: "pr-5",
    title: "Industrial CNC Tooling — Plant 2",
    department: "Manufacturing",
    budget: 188000,
    status: "Draft",
    createdDate: "2026-06-07",
    requiredDate: "2026-08-20",
    requester: "Sofia Almeida",
    category: "Manufacturing",
    businessNeed:
      "Procurement of precision CNC tooling and carbide inserts to support the increased production volume for the Q4 product line. Critical to meet committed OEM delivery dates.",
    attachments: [],
  },
  {
    id: "pr-6",
    title: "Datadog Observability Platform (Pro Tier)",
    department: "Engineering",
    budget: 144000,
    status: "Approved",
    createdDate: "2026-05-12",
    requiredDate: "2026-07-01",
    requester: "Priya Sharma",
    category: "Software Licenses",
    businessNeed:
      "Consolidate fragmented monitoring tools into a single observability platform covering APM, logs, and infrastructure metrics across 600+ hosts.",
    attachments: [{ name: "tooling-comparison.pdf", size: "310 KB" }],
  },
  {
    id: "pr-7",
    title: "Fleet of 25 Logistics Tablets (Rugged)",
    department: "Operations",
    budget: 42500,
    status: "Rejected",
    createdDate: "2026-05-30",
    requiredDate: "2026-07-20",
    requester: "James Okafor",
    category: "IT Hardware",
    businessNeed:
      "Rugged tablets for warehouse scanning and last-mile delivery confirmation. Rejected pending consolidation with the broader mobility refresh program.",
    attachments: [{ name: "rugged-device-specs.pdf", size: "210 KB" }],
  },
  {
    id: "pr-8",
    title: "Raw Aluminium Stock — Q3 Supply",
    department: "Manufacturing",
    budget: 420000,
    status: "In RFQ",
    createdDate: "2026-06-01",
    requiredDate: "2026-07-25",
    requester: "Sofia Almeida",
    category: "Manufacturing",
    businessNeed:
      "Quarterly supply of 6061-T6 aluminium billet for the machining line. Hedging against commodity price volatility with a fixed-price quarterly agreement.",
    attachments: [{ name: "material-grade-cert.pdf", size: "88 KB" }],
  },
]

export const vendors: Vendor[] = [
  {
    id: "v-1",
    name: "Dell Technologies",
    category: "IT Hardware",
    rating: 4.8,
    leadTime: "3-4 weeks",
    performanceScore: 94,
    aiScore: 92,
    status: "Active",
    location: "Round Rock, TX",
    contact: {
      name: "Rachel Tan",
      email: "rachel.tan@dell.com",
      phone: "+1 (512) 555-0142",
    },
    spend: 1840000,
    orders: 64,
    onTimeDelivery: 96,
    documents: [
      { name: "Master Service Agreement", type: "Contract", date: "2025-01-12" },
      { name: "ISO 9001 Certificate", type: "Compliance", date: "2025-03-04" },
      { name: "W-9 Tax Form", type: "Finance", date: "2024-11-20" },
    ],
  },
  {
    id: "v-2",
    name: "Cisco Systems",
    category: "Networking",
    rating: 4.6,
    leadTime: "5-7 weeks",
    performanceScore: 91,
    aiScore: 89,
    status: "Active",
    location: "San Jose, CA",
    contact: {
      name: "Mateo Garcia",
      email: "mgarcia@cisco.com",
      phone: "+1 (408) 555-0188",
    },
    spend: 760000,
    orders: 31,
    onTimeDelivery: 89,
    documents: [
      { name: "Volume Purchase Agreement", type: "Contract", date: "2025-02-18" },
      { name: "Cyber Insurance Cert", type: "Compliance", date: "2025-04-01" },
    ],
  },
  {
    id: "v-3",
    name: "Steelcase",
    category: "Office Furniture",
    rating: 4.5,
    leadTime: "4-6 weeks",
    performanceScore: 88,
    aiScore: 86,
    status: "Active",
    location: "Grand Rapids, MI",
    contact: {
      name: "Hannah Brooks",
      email: "hbrooks@steelcase.com",
      phone: "+1 (616) 555-0119",
    },
    spend: 540000,
    orders: 22,
    onTimeDelivery: 92,
    documents: [
      { name: "Supply Agreement 2025", type: "Contract", date: "2025-01-30" },
      { name: "Sustainability Report", type: "Compliance", date: "2025-02-22" },
    ],
  },
  {
    id: "v-4",
    name: "Lenovo Group",
    category: "IT Hardware",
    rating: 4.3,
    leadTime: "2-3 weeks",
    performanceScore: 85,
    aiScore: 88,
    status: "Active",
    location: "Morrisville, NC",
    contact: {
      name: "Wei Zhang",
      email: "wzhang@lenovo.com",
      phone: "+1 (919) 555-0167",
    },
    spend: 620000,
    orders: 38,
    onTimeDelivery: 91,
    documents: [
      { name: "Reseller Agreement", type: "Contract", date: "2025-03-11" },
    ],
  },
  {
    id: "v-5",
    name: "HP Enterprise",
    category: "IT Hardware",
    rating: 4.1,
    leadTime: "3-5 weeks",
    performanceScore: 82,
    aiScore: 80,
    status: "Under Review",
    location: "Spring, TX",
    contact: {
      name: "Olivia Park",
      email: "olivia.park@hpe.com",
      phone: "+1 (281) 555-0133",
    },
    spend: 410000,
    orders: 19,
    onTimeDelivery: 84,
    documents: [
      { name: "Framework Agreement", type: "Contract", date: "2024-12-05" },
    ],
  },
  {
    id: "v-6",
    name: "Adobe Inc.",
    category: "Software Licenses",
    rating: 4.7,
    leadTime: "Instant",
    performanceScore: 93,
    aiScore: 90,
    status: "Active",
    location: "San Jose, CA",
    contact: {
      name: "Daniel Reyes",
      email: "dreyes@adobe.com",
      phone: "+1 (408) 555-0204",
    },
    spend: 230000,
    orders: 12,
    onTimeDelivery: 100,
    documents: [
      { name: "Enterprise Term License", type: "Contract", date: "2025-01-01" },
    ],
  },
  {
    id: "v-7",
    name: "Alcoa Materials",
    category: "Manufacturing",
    rating: 4.2,
    leadTime: "6-8 weeks",
    performanceScore: 79,
    aiScore: 77,
    status: "Active",
    location: "Pittsburgh, PA",
    contact: {
      name: "Grace Miller",
      email: "gmiller@alcoa.com",
      phone: "+1 (412) 555-0150",
    },
    spend: 980000,
    orders: 27,
    onTimeDelivery: 81,
    documents: [
      { name: "Commodity Supply Contract", type: "Contract", date: "2025-02-09" },
      { name: "Material Test Reports", type: "Quality", date: "2025-05-15" },
    ],
  },
  {
    id: "v-8",
    name: "Herman Miller",
    category: "Office Furniture",
    rating: 4.4,
    leadTime: "5-7 weeks",
    performanceScore: 87,
    aiScore: 84,
    status: "Inactive",
    location: "Zeeland, MI",
    contact: {
      name: "Noah Bennett",
      email: "nbennett@hermanmiller.com",
      phone: "+1 (616) 555-0177",
    },
    spend: 175000,
    orders: 9,
    onTimeDelivery: 88,
    documents: [],
  },
]

export const rfqs: Rfq[] = [
  {
    id: "rfq-1",
    number: "RFQ-2026-0142",
    title: "120x Engineering Laptops (Dell XPS 15)",
    requestLinked: "PR-1042",
    vendorsInvited: 4,
    vendorsResponded: 3,
    closingDate: "2026-06-18",
    status: "Closing Soon",
    category: "IT Hardware",
    estimatedValue: 264000,
  },
  {
    id: "rfq-2",
    number: "RFQ-2026-0138",
    title: "Raw Aluminium Stock — Q3 Supply",
    requestLinked: "PR-1051",
    vendorsInvited: 5,
    vendorsResponded: 4,
    closingDate: "2026-06-22",
    status: "Open",
    category: "Manufacturing",
    estimatedValue: 420000,
  },
  {
    id: "rfq-3",
    number: "RFQ-2026-0130",
    title: "Core Network Switch Upgrade",
    requestLinked: "PR-1048",
    vendorsInvited: 3,
    vendorsResponded: 3,
    closingDate: "2026-06-10",
    status: "Awarded",
    category: "Networking",
    estimatedValue: 312000,
  },
  {
    id: "rfq-4",
    number: "RFQ-2026-0125",
    title: "Ergonomic Standing Desks — HQ Floor 4",
    requestLinked: "PR-1039",
    vendorsInvited: 4,
    vendorsResponded: 2,
    closingDate: "2026-05-30",
    status: "Closed",
    category: "Office Furniture",
    estimatedValue: 96000,
  },
  {
    id: "rfq-5",
    number: "RFQ-2026-0119",
    title: "Datadog Observability Platform",
    requestLinked: "PR-1033",
    vendorsInvited: 2,
    vendorsResponded: 2,
    closingDate: "2026-06-25",
    status: "Open",
    category: "Software Licenses",
    estimatedValue: 144000,
  },
]

export const quoteComparison: QuoteLine[] = [
  {
    vendor: "Dell Technologies",
    unitPrice: 2150,
    deliveryDays: 21,
    warranty: "3 years on-site",
    totalCost: 258000,
    paymentTerms: "Net 45",
    riskLevel: "Low",
  },
  {
    vendor: "Lenovo Group",
    unitPrice: 1980,
    deliveryDays: 18,
    warranty: "2 years depot",
    totalCost: 237600,
    paymentTerms: "Net 30",
    riskLevel: "Low",
  },
  {
    vendor: "HP Enterprise",
    unitPrice: 2090,
    deliveryDays: 28,
    warranty: "3 years next-business-day",
    totalCost: 250800,
    paymentTerms: "Net 60",
    riskLevel: "Medium",
  },
]

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    number: "PO-2026-3301",
    vendor: "Cisco Systems",
    amount: 312000,
    status: "Acknowledged",
    issuedDate: "2026-06-08",
    expectedDelivery: "2026-09-05",
    items: [
      { name: "Catalyst 9500 400G Switch", qty: 6, unitPrice: 42000 },
      { name: "400G QSFP-DD Transceiver", qty: 24, unitPrice: 2500 },
    ],
  },
  {
    id: "po-2",
    number: "PO-2026-3298",
    vendor: "Adobe Inc.",
    amount: 51000,
    status: "Delivered",
    issuedDate: "2026-06-03",
    expectedDelivery: "2026-06-03",
    items: [{ name: "Creative Cloud Enterprise (85 seats)", qty: 85, unitPrice: 600 }],
  },
  {
    id: "po-3",
    number: "PO-2026-3290",
    vendor: "Steelcase",
    amount: 96000,
    status: "Issued",
    issuedDate: "2026-06-06",
    expectedDelivery: "2026-08-01",
    items: [
      { name: "Series 7 Height-Adjustable Desk", qty: 80, unitPrice: 850 },
      { name: "Leap Ergonomic Chair", qty: 80, unitPrice: 350 },
    ],
  },
  {
    id: "po-4",
    number: "PO-2026-3285",
    vendor: "Dell Technologies",
    amount: 237600,
    status: "Draft",
    issuedDate: "2026-06-09",
    expectedDelivery: "2026-07-15",
    items: [{ name: "Latitude 7450 Laptop", qty: 120, unitPrice: 1980 }],
  },
  {
    id: "po-5",
    number: "PO-2026-3279",
    vendor: "Alcoa Materials",
    amount: 420000,
    status: "Acknowledged",
    issuedDate: "2026-06-04",
    expectedDelivery: "2026-07-25",
    items: [{ name: "6061-T6 Aluminium Billet (metric ton)", qty: 140, unitPrice: 3000 }],
  },
  {
    id: "po-6",
    number: "PO-2026-3270",
    vendor: "Lenovo Group",
    amount: 88000,
    status: "Cancelled",
    issuedDate: "2026-05-28",
    expectedDelivery: "2026-06-30",
    items: [{ name: "ThinkPad X1 Carbon", qty: 40, unitPrice: 2200 }],
  },
]

export interface Activity {
  id: string
  actor: string
  action: string
  target: string
  time: string
  type: "request" | "rfq" | "po" | "vendor" | "ai"
}

export const recentActivity: Activity[] = [
  {
    id: "a-1",
    actor: "AI Copilot",
    action: "recommended a vendor for",
    target: "RFQ-2026-0142",
    time: "12 min ago",
    type: "ai",
  },
  {
    id: "a-2",
    actor: "Priya Sharma",
    action: "submitted purchase request",
    target: "Engineering Laptops",
    time: "48 min ago",
    type: "request",
  },
  {
    id: "a-3",
    actor: "David Chen",
    action: "awarded RFQ to Cisco for",
    target: "Network Switch Upgrade",
    time: "2 hours ago",
    type: "rfq",
  },
  {
    id: "a-4",
    actor: "Elena Rodriguez",
    action: "issued purchase order",
    target: "PO-2026-3290",
    time: "3 hours ago",
    type: "po",
  },
  {
    id: "a-5",
    actor: "Procurement Bot",
    action: "onboarded new vendor",
    target: "Alcoa Materials",
    time: "5 hours ago",
    type: "vendor",
  },
  {
    id: "a-6",
    actor: "Marcus Webb",
    action: "requested approval for",
    target: "Adobe Creative Cloud",
    time: "Yesterday",
    type: "request",
  },
]

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
