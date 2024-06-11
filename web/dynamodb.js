import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
 
// Create a DynamoDB client with the specified region
//const ddbClient = new DynamoDBClient({ region: "us-east-2" }); // Replace with your region

const ddbClient = new DynamoDBClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY, // Replace with your AWS access key ID
      secretAccessKey: process.env.SECRET_KEY // Replace with your AWS secret access key
    },
  });

const docClient = DynamoDBDocumentClient.from(ddbClient); // Create a document client from the DynamoDB client
 
const serializeSession = (session) => {
  if (session && session.carrier_service_status !== undefined) {
    return {
      ...session,
      carrier_service_status: session.carrier_service_status.toString(),
    };
  }
  return session;
};
 
const createTable = async () => {
  const tableName = "ShopifyCarrierStatus";
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "shop", KeyType: "HASH" }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: "shop", AttributeType: "S" }, // Attribute type for "shop" is String
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, // Set appropriate values for read/write capacity
      WriteCapacityUnits: 5,
    },
  };

  try {
    // Check if the table exists
    const describeTableCommand = new DescribeTableCommand({ TableName: tableName });
    await ddbClient.send(describeTableCommand);
    console.log(`DynamoDB table ${tableName} already exists`);
  } catch (error) {
    // If the table doesn't exist, create it
    if (error.name === "ResourceNotFoundException") {
      const createTableCommand = new CreateTableCommand(params);
      await ddbClient.send(createTableCommand);
      console.log("DynamoDB table created successfully");
    } else {
      console.error("Error creating DynamoDB table", error);
    }
  }
};
 
const insertData = async (current_shop, carrier_service_status) => {
  const params = {
    TableName: "ShopifyCarrierStatus",
    Item: {
      shop: current_shop, // Partition key (String)
      carrierStatus: carrier_service_status, // Additional attribute (Number)
    },
  };

  try {
    const putCommand = new PutCommand(params);
    await docClient.send(putCommand);
    console.log("Data inserted successfully");
  } catch (err) {
    console.error("Error inserting data", err);
  }
};

const readData = async (current_shop) => {
  const params = {
    TableName: "ShopifyCarrierStatus",
    Key: {
      shop: current_shop, // Partition key (String)
    },
  };

  try {
    const getCommand = new GetCommand(params);
    const response = await docClient.send(getCommand);
    console.log("Data retrieved successfully:", response.Item);

    if (response && response.Item && response.Item.carrierStatus === 1) {
      console.log("CarrierStatus is 1. Cannot perform action.");
      return Promise.resolve({ carrierStatus: 1 });
    } else {
      console.log("CarrierStatus is not 1. Can perform action.");
      return Promise.resolve({ carrierStatus: 0, data: response.Item });
    }
  } catch (err) {
    console.error("Error reading data", err);
    return Promise.reject(err);
  }
};

const deleteData = async (current_shop) => {
  const params = {
    TableName: "ShopifyCarrierStatus",
    Key: {
      shop: current_shop, // Partition key (String)
    },
  };

  try {
    const deleteCommand = new DeleteCommand(params);
    await docClient.send(deleteCommand);
    console.log("Data deleted successfully");
  } catch (err) {
    console.error("Error deleting data", err);
  }
};

// (async () => {
//   await createTable();
//   await insertData();
//   await readData();
// })();

export { createTable, insertData, readData, deleteData };