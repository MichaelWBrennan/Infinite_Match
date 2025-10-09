
# Unity Services Setup Instructions

## 1. Unity Dashboard Configuration

### Economy Service
1. Go to Unity Dashboard → Economy
2. Create the following currencies:
   - coins (Soft Currency)
   - gems (Hard Currency)
   - energy (Consumable)

3. Create inventory items:
   - booster_extra_moves
   - booster_color_bomb

### Authentication Service
1. Go to Unity Dashboard → Authentication
2. Enable Anonymous Sign-In
3. Configure authentication settings

### Cloud Code Service
1. Go to Unity Dashboard → Cloud Code
2. Deploy the following functions:
   - AddCurrency
   - SpendCurrency
   - AddInventoryItem
   - UseInventoryItem

### Analytics Service
1. Go to Unity Dashboard → Analytics
2. Configure custom events:
   - economy_purchase
   - economy_balance_change
   - economy_inventory_change

## 2. Update Configuration

Update the following file with your actual project details:
`unity/Assets/StreamingAssets/unity_services_config.json`

Replace:
- `your-unity-project-id` with your actual project ID
- `your-environment-id` with your actual environment ID

## 3. Test Configuration

Run the following command to test the setup:
```bash
cd scripts
python3 setup_unity_services.py
```
