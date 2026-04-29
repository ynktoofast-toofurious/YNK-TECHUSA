DRC Government Power BI Star Schema Package
Generated: 2026-04-28
Scope: DRC national government hierarchy, Suminwa II cabinet members, and structural tables for parliament, judiciary, provincial, and local government.

Recommended Power BI load:
1. Load all CSV files from this folder.
2. Create relationships exactly as listed in PowerBI_Relationships.csv.
3. Use Fact_GovernmentPosition as the central fact table.
4. Use Dim_Branch, Dim_RoleCategory, Dim_Institution, Dim_Person, and Dim_Geography as dimension tables.
5. Add DAX measures from DAX_Measures.csv.

Important notes:
- Current cabinet members are based on the official Primature Suminwa II page: https://www.primature.gouv.cd/membres-du-gouvernement-suminwa-2/
- Government size/category reference: https://www.radiookapi.net/2025/08/08/actualite/revue-de-presse/africanews-gouvernement-suminwa-ii-voici-la-liste-complete
- Parliament, judiciary, and local levels are included as structure-ready rows. Add named officeholders in Dim_Person and Fact_GovernmentPosition when you verify each institution.
- This is a BI data model package, not a completed .pbix file.
