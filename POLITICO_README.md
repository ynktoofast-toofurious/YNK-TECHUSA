# Politico Integration Guide

## Overview
The Politico page in the YNK-Tech USA admin portal provides an AI-powered concierge and interactive visualization for exploring the Democratic Republic of the Congo government structure.

## Features

### 1. AI Chat Concierge
- Dedicated AI assistant that answers questions about the DRC government
- Natural language queries about officials, positions, and structure
- Contextual responses based on real government data
- Chat history management

### 2. Interactive Hierarchy Visualization
- Tree view: Visual representation of government hierarchy
- List view: Grid-based view of all positions
- Click any position to see detailed information
- View chain of command for any position
- Color-coded levels (President, Prime Minister, Ministers, etc.)

### 3. Government Statistics
- Real-time statistics dashboard
- Total officials, positions, branches, and institutions
- Named officeholder tracking

## Data Source
The data is based on the official DRC Government structure including:
- **Suminwa II Cabinet** members from the official Primature page
- Government hierarchy including Executive, Legislative, and Judicial branches
- Geographic organization (national, provincial, local levels)
- Institutional relationships

Data files are located in: `/Politico/drc_government_powerbi_star_schema_package/`

## File Structure

```
Admin/
├── politico.css                    # Styles for Politico page
├── politico-data.js                # Data loading and management
├── politico-concierge.js           # AI chat concierge logic
├── politico-visualization.js       # Hierarchy visualization
├── politico-controller.js          # Main page controller
└── index.html                      # Updated with Politico tab

Politico/
└── drc_government_powerbi_star_schema_package/
    ├── Dim_Person.csv             # Government officials
    ├── Fact_GovernmentPosition.csv # Position hierarchy
    ├── Dim_Institution.csv        # Government institutions
    ├── Dim_Branch.csv             # Government branches
    ├── Dim_RoleCategory.csv       # Role classifications
    ├── Dim_Geography.csv          # Geographic divisions
    ├── PowerBI_Relationships.csv  # Data relationships
    ├── DAX_Measures.csv           # Calculated measures
    └── README_Model_Guide.txt     # Data model documentation
```

## How to Use

### Accessing the Politico Page
1. Log into the admin portal
2. Click the "POLITICO" tab in the main navigation
3. The page will automatically load the government data

### Using the Chat Concierge
Ask questions like:
- "Who is the President?"
- "Tell me about the Prime Minister"
- "How many ministers are there?"
- "Who are the Vice Prime Ministers?"
- "Show me the Minister of Foreign Affairs"
- "What is the chain of command?"

The concierge will provide detailed answers based on the loaded data.

### Exploring the Hierarchy
1. **Tree View**: Shows the hierarchical structure from President down
   - Click any position card to see details
   - Use "View Chain of Command" to see reporting structure
   
2. **List View**: Shows all positions in a grid
   - Sorted by rank order
   - Shows level and position information
   - Click "View Details" on any card

## Hosting on S3

### Option 1: Using the PowerShell Script (Recommended)

Run the included upload script:
```powershell
.\upload-politico-to-s3.ps1 -BucketName "your-bucket-name" -Region "us-east-1"
```

The script will:
- Create the S3 bucket if it doesn't exist
- Configure public read access
- Upload all Politico data files
- Set appropriate cache and content-type headers
- Optionally enable CORS

### Option 2: Manual AWS CLI Upload

```bash
# Create bucket (if needed)
aws s3 mb s3://your-bucket-name --region us-east-1

# Upload files
aws s3 sync Politico/ s3://your-bucket-name/politico/ --acl public-read

# Configure CORS (if needed)
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json
```

### Option 3: AWS Console
1. Go to AWS S3 Console
2. Create a new bucket
3. Upload the `Politico` folder
4. Set permissions to allow public read access
5. Enable CORS if accessing from a different domain

### Updating the Data URL
After uploading to S3, update the baseUrl in `Admin/politico-data.js`:

```javascript
// Change from local path:
const baseUrl = '../Politico/drc_government_powerbi_star_schema_package/';

// To S3 URL:
const baseUrl = 'https://your-bucket-name.s3.region.amazonaws.com/politico/drc_government_powerbi_star_schema_package/';
```

## CORS Configuration
If you're accessing the S3 data from a different domain, add this CORS policy to your bucket:

```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": [],
            "MaxAgeSeconds": 3600
        }
    ]
}
```

## Updating the Data

### Adding New Officials
1. Edit `Dim_Person.csv` to add new person records
2. Edit `Fact_GovernmentPosition.csv` to assign them to positions
3. Re-upload the files to S3 (if hosted)
4. Refresh the admin portal

### Modifying the Hierarchy
1. Edit `Fact_GovernmentPosition.csv`
2. Update the `Parent_Position_ID` field to change reporting relationships
3. Re-upload and refresh

## Customization

### Modifying the Chat Concierge
Edit `politico-concierge.js` to:
- Add new question patterns
- Customize response templates
- Add multilingual support
- Integrate with external APIs

### Styling
Edit `politico.css` to customize:
- Color schemes
- Layout and spacing
- Animation effects
- Mobile responsiveness

### Visualization
Edit `politico-visualization.js` to:
- Add new view types (e.g., org chart, network graph)
- Customize node rendering
- Add filtering options
- Export functionality

## Browser Requirements
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Support for ES6+ features
- Fetch API support

## Performance Notes
- Data is loaded once when the Politico tab is first opened
- All subsequent operations use cached data
- Recommended max CSV size: 5MB per file
- Tree view may slow down with >1000 nodes

## Troubleshooting

### Data Not Loading
- Check browser console for errors
- Verify CSV file paths are correct
- Ensure files are accessible (check CORS if using S3)
- Validate CSV format (no malformed lines)

### Visualization Not Rendering
- Check that data loaded successfully
- Verify container element exists
- Check for JavaScript errors in console
- Try refreshing the page

### Chat Concierge Not Responding
- Ensure PoliticoData is loaded
- Check for JavaScript errors
- Verify question patterns in politico-concierge.js

## Security Notes
- Admin portal requires authentication
- Politico data is read-only in the UI
- S3 bucket should have appropriate access controls
- Consider CloudFront for better performance and security

## Future Enhancements
- Real-time data updates from APIs
- Advanced search and filtering
- Export functionality (PDF, Excel)
- Comparison views (term-over-term)
- Integration with external databases
- Machine learning for better chat responses
- Multilingual support (French, Lingala, Swahili)

## Credits
- Data sourced from official DRC government websites
- Built for YNK-Tech USA Admin Portal
- Based on Power BI star schema methodology

## Support
For questions or issues, contact the YNK-Tech USA development team.

---

Last Updated: April 28, 2026
Version: 1.0.0
