# UGS CLI Setup for Unity Cloud Code

## Install UGS CLI

On your local machine (not in this restricted environment), run:

```bash
# Install Unity CLI
npm install -g @unity/cloud-code-cli

# Or install Unity Gaming Services CLI
npm install -g @unity/ugs-cli
```

## Authenticate with Unity

```bash
# Login to Unity
unity auth login

# Or with UGS CLI
ugs auth login
```

## Deploy Cloud Code with UGS CLI

### 1. Navigate to your cloud code directory
```bash
cd cloud-code-csharp
```

### 2. Deploy C# Cloud Code Functions
```bash
# Deploy using Unity CLI
unity cloud-code deploy \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --source-dir src \
  --function-config cloud-code-config.json

# Or using UGS CLI
ugs cloud-code deploy \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --source-dir src
```

### 3. Deploy Economy Data
```bash
# Deploy currencies
unity economy currencies create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/currencies.csv

# Deploy inventory
unity economy inventory create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/inventory.csv

# Deploy catalog
unity economy catalog create \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file economy/catalog.csv
```

### 4. Deploy Remote Config
```bash
unity remote-config deploy \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6 \
  --file remote-config/remote-config.json
```

## Verify Deployment

```bash
# List cloud code functions
unity cloud-code list \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6

# List economy data
unity economy list \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6

# List remote config
unity remote-config list \
  --project-id 0dd5a03e-7f23-49c4-964e-7919c48c0574 \
  --environment-id 1d8c470b-d8d2-4a72-88f6
```

## Your Project Details

- **Project ID**: `0dd5a03e-7f23-49c4-964e-7919c48c0574`
- **Environment ID**: `1d8c470b-d8d2-4a72-88f6`
- **Email**: `michaelwilliambrennan@gmail.com`

## Files Ready for Deployment

- **C# Cloud Code**: `cloud-code-csharp/src/` (4 functions)
- **Economy Data**: `economy/` (currencies, inventory, catalog)
- **Remote Config**: `remote-config/` (configuration settings)

Run these commands on your local machine where you have the UGS CLI installed!