#!/bin/bash

# ==============================================================================
# MASTER DEPLOYMENT SCRIPT
# Pushes local configurations and executes remote deployments across all EC2 nodes
# ==============================================================================

# ─── Configuration ────────────────────────────────────────────────────────────
KEY_PATH="$HOME/.ssh/your-aws-key.pem"
SSH_USER="ubuntu" # Change to 'ec2-user' if running Amazon Linux

# List of folders to deploy
FOLDERS=("ec2-1" "ec2-2" "ec2-3" "ec2-4")

# Function to get IP for a given folder
get_ip() {
    case $1 in
        "ec2-1") echo "YOUR_EC2_1_PUBLIC_IP" ;;
        "ec2-2") echo "YOUR_EC2_2_PUBLIC_IP" ;;
        "ec2-3") echo "YOUR_EC2_3_PUBLIC_IP" ;;
        "ec2-4") echo "YOUR_EC2_4_PUBLIC_IP" ;;
    esac
}

# Ensure local SSH key has the correct permissions to prevent connection rejections
chmod 400 "$KEY_PATH"

# ─── Deployment Engine ────────────────────────────────────────────────────────
for FOLDER in "${FOLDERS[@]}"; do
    IP=$(get_ip "$FOLDER")
    
    echo "======================================================================"
    echo "🚀 DEPLOYING TO: $FOLDER (IP: $IP)"
    echo "======================================================================"

    # Step 1: Securely copy the specific EC2 folder to the remote home directory
    echo "📦 Transferring local $FOLDER directory to remote server..."
    scp -i "$KEY_PATH" -r -o StrictHostKeyChecking=no "./$FOLDER" "$SSH_USER@$IP:~/$FOLDER"

    # Step 2: SSH into the server and execute setup/deployment remotely
    echo "🔌 Connecting via SSH to run environment setup and Docker commands..."
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$IP" << EOF
        
        # Move into the newly transferred directory
        cd ~/$FOLDER

        # Handle Environment Variables from Template
        if [ ! -f .env ]; then
            echo "⚙️  Generating .env from env-template..."
            cp env-template .env
        else
            echo "✅ .env already exists, skipping template copy."
        fi

        # OS Updates
        echo "🔄 Updating OS packages..."
        sudo apt-get update -y
        # Note: upgrade is commented out by default to prevent unexpected kernel 
        # updates that require reboots during automated deployments. 
        # Uncomment the line below if you want full unattended upgrades.
        # sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

        # Install Docker if missing
        if ! command -v docker &> /dev/null; then
            echo "🐳 Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $SSH_USER
        fi

        # Install Docker Compose (V2 plugin approach) if missing
        if ! docker compose version &> /dev/null; then
            echo "🧩 Installing Docker Compose..."
            sudo apt-get install docker-compose-plugin -y
        fi

        # Execute the specific deployment script for this node
        echo "🚀 Executing node-specific deploy.sh..."
        chmod +x deploy.sh
        ./deploy.sh

EOF

    echo "✅ Finished deploying to $FOLDER!"
    echo ""
done

echo "🎉 All services successfully deployed across the cluster."