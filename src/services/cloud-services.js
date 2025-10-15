import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { PubSub } from '@google-cloud/pubsub';
import { MonitoringServiceV2Client } from '@google-cloud/monitoring';
import { LoggingServiceV2Client } from '@google-cloud/logging';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { ServiceBusClient } from '@azure/service-bus';
import { CosmosClient } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comprehensive Cloud Services Manager for Match 3 Game
 * Integrates AWS, Google Cloud, and Azure services
 */
class CloudServicesManager {
    constructor() {
        this.awsClients = {};
        this.googleClients = {};
        this.azureClients = {};
        this.isInitialized = false;
    }

    /**
     * Initialize all cloud services
     */
    async initialize() {
        try {
            // Initialize AWS services
            await this.initializeAWS();
            
            // Initialize Google Cloud services
            await this.initializeGoogleCloud();
            
            // Initialize Azure services
            await this.initializeAzure();
            
            this.isInitialized = true;
            console.log('Cloud Services Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Cloud Services Manager:', error);
            throw error;
        }
    }

    /**
     * Initialize AWS services
     */
    async initializeAWS() {
        const awsConfig = {
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        };

        this.awsClients = {
            s3: new S3Client(awsConfig),
            ses: new SESClient(awsConfig),
            sns: new SNSClient(awsConfig),
            sqs: new SQSClient(awsConfig),
            dynamodb: new DynamoDBClient(awsConfig)
        };

        console.log('AWS services initialized');
    }

    /**
     * Initialize Google Cloud services
     */
    async initializeGoogleCloud() {
        const googleConfig = {
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
        };

        this.googleClients = {
            storage: new Storage(googleConfig),
            firestore: new Firestore(googleConfig),
            pubsub: new PubSub(googleConfig),
            monitoring: new MonitoringServiceV2Client(googleConfig),
            logging: new LoggingServiceV2Client(googleConfig)
        };

        console.log('Google Cloud services initialized');
    }

    /**
     * Initialize Azure services
     */
    async initializeAzure() {
        const credential = new DefaultAzureCredential();

        this.azureClients = {
            blobStorage: new BlobServiceClient(
                `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
                credential
            ),
            keyVault: new SecretClient(
                `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`,
                credential
            ),
            serviceBus: new ServiceBusClient(
                process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
            ),
            cosmos: new CosmosClient({
                endpoint: process.env.AZURE_COSMOS_ENDPOINT,
                key: process.env.AZURE_COSMOS_KEY
            })
        };

        console.log('Azure services initialized');
    }

    // ==================== AWS Services ====================

    /**
     * Save game data to S3
     */
    async saveGameDataToS3(bucketName, key, data) {
        if (!this.awsClients.s3) throw new Error('AWS S3 not initialized');

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(data),
            ContentType: 'application/json',
            Metadata: {
                'game-version': process.env.GAME_VERSION || '1.0.0',
                'timestamp': new Date().toISOString()
            }
        });

        const result = await this.awsClients.s3.send(command);
        console.log(`Game data saved to S3: ${key}`);
        return result;
    }

    /**
     * Load game data from S3
     */
    async loadGameDataFromS3(bucketName, key) {
        if (!this.awsClients.s3) throw new Error('AWS S3 not initialized');

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const result = await this.awsClients.s3.send(command);
        const data = await result.Body.transformToString();
        return JSON.parse(data);
    }

    /**
     * Send email notification via SES
     */
    async sendEmailNotification(to, subject, body, htmlBody = null) {
        if (!this.awsClients.ses) throw new Error('AWS SES not initialized');

        const command = new SendEmailCommand({
            Source: process.env.AWS_SES_FROM_EMAIL,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: body,
                        Charset: 'UTF-8'
                    },
                    ...(htmlBody && {
                        Html: {
                            Data: htmlBody,
                            Charset: 'UTF-8'
                        }
                    })
                }
            }
        });

        const result = await this.awsClients.ses.send(command);
        console.log(`Email sent: ${result.MessageId}`);
        return result;
    }

    /**
     * Publish message to SNS topic
     */
    async publishToSNS(topicArn, message, subject = null) {
        if (!this.awsClients.sns) throw new Error('AWS SNS not initialized');

        const command = new PublishCommand({
            TopicArn: topicArn,
            Message: JSON.stringify(message),
            Subject: subject,
            MessageAttributes: {
                'game-event': {
                    DataType: 'String',
                    StringValue: message.eventType || 'general'
                }
            }
        });

        const result = await this.awsClients.sns.send(command);
        console.log(`Message published to SNS: ${result.MessageId}`);
        return result;
    }

    /**
     * Send message to SQS queue
     */
    async sendToSQS(queueUrl, message) {
        if (!this.awsClients.sqs) throw new Error('AWS SQS not initialized');

        const command = new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                'timestamp': {
                    DataType: 'String',
                    StringValue: new Date().toISOString()
                }
            }
        });

        const result = await this.awsClients.sqs.send(command);
        console.log(`Message sent to SQS: ${result.MessageId}`);
        return result;
    }

    /**
     * Save player data to DynamoDB
     */
    async savePlayerDataToDynamoDB(tableName, playerData) {
        if (!this.awsClients.dynamodb) throw new Error('AWS DynamoDB not initialized');

        const command = new PutItemCommand({
            TableName: tableName,
            Item: {
                player_id: { S: playerData.playerId },
                level: { N: playerData.level.toString() },
                score: { N: playerData.score.toString() },
                last_updated: { S: new Date().toISOString() },
                game_data: { S: JSON.stringify(playerData.gameData) }
            }
        });

        const result = await this.awsClients.dynamodb.send(command);
        console.log(`Player data saved to DynamoDB: ${playerData.playerId}`);
        return result;
    }

    // ==================== Google Cloud Services ====================

    /**
     * Save game data to Google Cloud Storage
     */
    async saveGameDataToGCS(bucketName, fileName, data) {
        if (!this.googleClients.storage) throw new Error('Google Cloud Storage not initialized');

        const bucket = this.googleClients.storage.bucket(bucketName);
        const file = bucket.file(fileName);

        await file.save(JSON.stringify(data), {
            metadata: {
                contentType: 'application/json',
                metadata: {
                    'game-version': process.env.GAME_VERSION || '1.0.0',
                    'timestamp': new Date().toISOString()
                }
            }
        });

        console.log(`Game data saved to GCS: ${fileName}`);
    }

    /**
     * Save player data to Firestore
     */
    async savePlayerDataToFirestore(collectionName, playerId, playerData) {
        if (!this.googleClients.firestore) throw new Error('Firestore not initialized');

        const docRef = this.googleClients.firestore.collection(collectionName).doc(playerId);
        
        await docRef.set({
            ...playerData,
            last_updated: new Date(),
            version: process.env.GAME_VERSION || '1.0.0'
        });

        console.log(`Player data saved to Firestore: ${playerId}`);
    }

    /**
     * Publish message to Google Pub/Sub
     */
    async publishToPubSub(topicName, message) {
        if (!this.googleClients.pubsub) throw new Error('Google Pub/Sub not initialized');

        const topic = this.googleClients.pubsub.topic(topicName);
        const dataBuffer = Buffer.from(JSON.stringify(message));

        const messageId = await topic.publish(dataBuffer, {
            gameEvent: message.eventType || 'general',
            timestamp: new Date().toISOString()
        });

        console.log(`Message published to Pub/Sub: ${messageId}`);
        return messageId;
    }

    // ==================== Azure Services ====================

    /**
     * Save game data to Azure Blob Storage
     */
    async saveGameDataToAzureBlob(containerName, blobName, data) {
        if (!this.azureClients.blobStorage) throw new Error('Azure Blob Storage not initialized');

        const containerClient = this.azureClients.blobStorage.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const uploadOptions = {
            blobHTTPHeaders: {
                blobContentType: 'application/json'
            },
            metadata: {
                'game-version': process.env.GAME_VERSION || '1.0.0',
                'timestamp': new Date().toISOString()
            }
        };

        await blockBlobClient.upload(JSON.stringify(data), JSON.stringify(data).length, uploadOptions);
        console.log(`Game data saved to Azure Blob: ${blobName}`);
    }

    /**
     * Get secret from Azure Key Vault
     */
    async getSecretFromKeyVault(secretName) {
        if (!this.azureClients.keyVault) throw new Error('Azure Key Vault not initialized');

        const secret = await this.azureClients.keyVault.getSecret(secretName);
        return secret.value;
    }

    /**
     * Send message to Azure Service Bus
     */
    async sendToServiceBus(queueName, message) {
        if (!this.azureClients.serviceBus) throw new Error('Azure Service Bus not initialized');

        const sender = this.azureClients.serviceBus.createSender(queueName);
        
        await sender.sendMessages({
            body: message,
            contentType: 'application/json',
            messageId: uuidv4(),
            timeToLive: 300000, // 5 minutes
            userProperties: {
                gameEvent: message.eventType || 'general',
                timestamp: new Date().toISOString()
            }
        });

        await sender.close();
        console.log(`Message sent to Service Bus: ${queueName}`);
    }

    /**
     * Save player data to Azure Cosmos DB
     */
    async savePlayerDataToCosmos(databaseName, containerName, playerData) {
        if (!this.azureClients.cosmos) throw new Error('Azure Cosmos DB not initialized');

        const { database } = await this.azureClients.cosmos.databases.createIfNotExists({
            id: databaseName
        });

        const { container } = await database.containers.createIfNotExists({
            id: containerName,
            partitionKey: '/player_id'
        });

        const item = {
            id: playerData.playerId,
            player_id: playerData.playerId,
            ...playerData,
            _ts: Math.floor(Date.now() / 1000)
        };

        await container.items.create(item);
        console.log(`Player data saved to Cosmos DB: ${playerData.playerId}`);
    }

    // ==================== Game-Specific Methods ====================

    /**
     * Save complete game state across all cloud services
     */
    async saveGameState(playerId, gameState) {
        const timestamp = new Date().toISOString();
        const gameData = {
            playerId,
            gameState,
            timestamp,
            version: process.env.GAME_VERSION || '1.0.0'
        };

        try {
            // Save to multiple cloud services for redundancy
            const promises = [];

            // AWS S3
            if (this.awsClients.s3) {
                promises.push(
                    this.saveGameDataToS3(
                        process.env.AWS_S3_BUCKET,
                        `game-states/${playerId}/${timestamp}.json`,
                        gameData
                    )
                );
            }

            // Google Cloud Storage
            if (this.googleClients.storage) {
                promises.push(
                    this.saveGameDataToGCS(
                        process.env.GOOGLE_CLOUD_BUCKET,
                        `game-states/${playerId}/${timestamp}.json`,
                        gameData
                    )
                );
            }

            // Azure Blob Storage
            if (this.azureClients.blobStorage) {
                promises.push(
                    this.saveGameDataToAzureBlob(
                        process.env.AZURE_CONTAINER_NAME,
                        `game-states/${playerId}/${timestamp}.json`,
                        gameData
                    )
                );
            }

            await Promise.allSettled(promises);
            console.log(`Game state saved for player: ${playerId}`);

        } catch (error) {
            console.error('Failed to save game state:', error);
            throw error;
        }
    }

    /**
     * Send game event notifications
     */
    async sendGameEventNotification(eventType, playerId, eventData) {
        const notification = {
            eventType,
            playerId,
            eventData,
            timestamp: new Date().toISOString()
        };

        try {
            const promises = [];

            // AWS SNS
            if (this.awsClients.sns && process.env.AWS_SNS_TOPIC_ARN) {
                promises.push(
                    this.publishToSNS(process.env.AWS_SNS_TOPIC_ARN, notification, `Game Event: ${eventType}`)
                );
            }

            // Google Pub/Sub
            if (this.googleClients.pubsub && process.env.GOOGLE_PUBSUB_TOPIC) {
                promises.push(
                    this.publishToPubSub(process.env.GOOGLE_PUBSUB_TOPIC, notification)
                );
            }

            // Azure Service Bus
            if (this.azureClients.serviceBus && process.env.AZURE_SERVICE_BUS_QUEUE) {
                promises.push(
                    this.sendToServiceBus(process.env.AZURE_SERVICE_BUS_QUEUE, notification)
                );
            }

            await Promise.allSettled(promises);
            console.log(`Game event notification sent: ${eventType}`);

        } catch (error) {
            console.error('Failed to send game event notification:', error);
            throw error;
        }
    }

    /**
     * Get service status
     */
    getServiceStatus() {
        return {
            is_initialized: this.isInitialized,
            aws: {
                s3: !!this.awsClients.s3,
                ses: !!this.awsClients.ses,
                sns: !!this.awsClients.sns,
                sqs: !!this.awsClients.sqs,
                dynamodb: !!this.awsClients.dynamodb
            },
            google: {
                storage: !!this.googleClients.storage,
                firestore: !!this.googleClients.firestore,
                pubsub: !!this.googleClients.pubsub,
                monitoring: !!this.googleClients.monitoring,
                logging: !!this.googleClients.logging
            },
            azure: {
                blobStorage: !!this.azureClients.blobStorage,
                keyVault: !!this.azureClients.keyVault,
                serviceBus: !!this.azureClients.serviceBus,
                cosmos: !!this.azureClients.cosmos
            }
        };
    }
}

// Export singleton instance
export default new CloudServicesManager();