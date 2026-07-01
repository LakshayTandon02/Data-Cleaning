export interface DemoDataset {
  name: string;
  description: string;
  headers: string[];
  rows: Record<string, any>[];
}

export const DEMO_DATASETS: DemoDataset[] = [
  {
    name: "Employee Salaries & Records (Messy)",
    description: "Contains trailing spaces, duplicates, outliers (Age 150, Salary $10M), inconsistent categorical cases ('yes', 'YES', '1'), and duplicate rows.",
    headers: ["Full Name", "Age", "Salary ($)", "Join Date", "Department", "Is Active"],
    rows: [
      {
        "Full Name": " lakshay tandon ",
        "Age": 28,
        "Salary ($)": "$95,000",
        "Join Date": "2024-03-12",
        "Department": "Engineering",
        "Is Active": "yes",
      },
      {
        "Full Name": "Alice Smith",
        "Age": null,
        "Salary ($)": "$125,500",
        "Join Date": "2022-08-19",
        "Department": "Engineering",
        "Is Active": "true",
      },
      {
        "Full Name": "Bob Johnson",
        "Age": 45,
        "Salary ($)": "$10,000,000", // Outlier salary
        "Join Date": "2019-11-01",
        "Department": "Executive",
        "Is Active": "yes",
      },
      {
        "Full Name": "Bob Johnson",
        "Age": 45,
        "Salary ($)": "$10,000,000", // Duplicate
        "Join Date": "2019-11-01",
        "Department": "Executive",
        "Is Active": "yes",
      },
      {
        "Full Name": "Charlie Brown",
        "Age": 31,
        "Salary ($)": null,
        "Join Date": "2023-01-15",
        "Department": "mkt",
        "Is Active": "no",
      },
      {
        "Full Name": "Diana Prince",
        "Age": 35,
        "Salary ($)": "$135,000",
        "Join Date": "2021-06-30",
        "Department": "Engineering",
        "Is Active": "YES",
      },
      {
        "Full Name": "Ethan Hunt",
        "Age": 150, // Outlier age
        "Salary ($)": "$85,000",
        "Join Date": "invalid-date",
        "Department": "Security",
        "Is Active": "no",
      },
      {
        "Full Name": "Fiona Gallagher",
        "Age": 24,
        "Salary ($)": "$60,000",
        "Join Date": null,
        "Department": "mkt",
        "Is Active": "no",
      },
      {
        "Full Name": "George Costanza",
        "Age": 42,
        "Salary ($)": "N/A",
        "Join Date": "1994-11-12",
        "Department": "Sales",
        "Is Active": "0",
      },
    ],
  },
  {
    name: "SaaS Marketing Leads (Outliers)",
    description: "SaaS transaction and signup data with null metrics, empty conversion signs, extreme pricing outliers, and inconsistent marketing source capitalization.",
    headers: ["Lead Email", "Registered At", "Monthly Budget ($)", "Team Size", "Conversion Source", "Qualified Balance"],
    rows: [
      {
        "Lead Email": "contact@tesla-mfg.com",
        "Registered At": "2025-02-14",
        "Monthly Budget ($)": "12,500",
        "Team Size": 140,
        "Conversion Source": "google search",
        "Qualified Balance": "yes",
      },
      {
        "Lead Email": "dev-ops@stark-ind.io",
        "Registered At": "2025-01-20",
        "Monthly Budget ($)": "250,000", // pricing outliers
        "Team Size": 820,
        "Conversion Source": "Google Search",
        "Qualified Balance": "YES",
      },
      {
        "Lead Email": "ceo@startup-nano.co",
        "Registered At": "2025-03-01",
        "Monthly Budget ($)": "450",
        "Team Size": null,
        "Conversion Source": "linkedin",
        "Qualified Balance": "no",
      },
      {
        "Lead Email": "marketing@retro-app.com",
        "Registered At": null,
        "Monthly Budget ($)": "1,200",
        "Team Size": 8,
        "Conversion Source": "Facebook Paid",
        "Qualified Balance": "NO",
      },
      {
        "Lead Email": "sales-info@retail-shop.net",
        "Registered At": "2024-12-05",
        "Monthly Budget ($)": "null",
        "Team Size": 18,
        "Conversion Source": "linkedin",
        "Qualified Balance": "yes",
      },
      {
        "Lead Email": "hiring@corporation-huge.com",
        "Registered At": "2025/02/10",
        "Monthly Budget ($)": "95,000",
        "Team Size": 4500, // Outlier team size
        "Conversion Source": "Google Search",
        "Qualified Balance": "1",
      },
    ],
  },
];
