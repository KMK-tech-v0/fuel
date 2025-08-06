-- SQL Server Management Studio (SSMS) Full Database Schema

-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'FuelInventoryDB')
BEGIN
    CREATE DATABASE FuelInventoryDB;
END
GO

-- Use the newly created or existing database
USE FuelInventoryDB;
GO

-- Drop tables if they exist to ensure a clean slate for recreation
-- Drop in reverse dependency order
IF OBJECT_ID('FuelInventory', 'U') IS NOT NULL DROP TABLE FuelInventory;
IF OBJECT_ID('FuelTransactions', 'U') IS NOT NULL DROP TABLE FuelTransactions;
IF OBJECT_ID('PriceFluctuations', 'U') IS NOT NULL DROP TABLE PriceFluctuations;
IF OBJECT_ID('FuelPrices', 'U') IS NOT NULL DROP TABLE FuelPrices;
IF OBJECT_ID('Warehouses', 'U') IS NOT NULL DROP TABLE Warehouses;
IF OBJECT_ID('Sites', 'U') IS NOT NULL DROP TABLE Sites;
IF OBJECT_ID('Townships', 'U') IS NOT NULL DROP TABLE Townships;
IF OBJECT_ID('Suppliers', 'U') IS NOT NULL DROP TABLE Suppliers;
IF OBJECT_ID('FuelTypes', 'U') IS NOT NULL DROP TABLE FuelTypes;
GO

-- 1. FuelTypes Table
-- Stores different types of fuel (e.g., Diesel, Petrol)
CREATE TABLE FuelTypes (
    FuelTypeID INT PRIMARY KEY IDENTITY(1,1),
    FuelTypeName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);
GO

-- 2. Suppliers Table
-- Stores information about fuel suppliers
CREATE TABLE Suppliers (
    SupplierID INT PRIMARY KEY IDENTITY(1,1),
    SupplierName NVARCHAR(100) NOT NULL,
    ContactPerson NVARCHAR(100) NULL,
    ContactEmail NVARCHAR(100) NULL,
    ContactPhone NVARCHAR(20) NULL,
    Address NVARCHAR(255) NULL,
    City NVARCHAR(100) NULL,
    Country NVARCHAR(100) NULL
);
GO

-- 3. Townships Table
-- Stores geographical township information, relevant for warehouse ID generation
CREATE TABLE Townships (
    TownshipID INT PRIMARY KEY IDENTITY(1,1),
    TownshipName NVARCHAR(100) NOT NULL UNIQUE,
    PostalCode NVARCHAR(20) NULL, -- Used for WH1 ID generation
    StateDivision NVARCHAR(100) NULL -- Used for WH1 ID generation (e.g., Sagaing, Kachin)
);
GO

-- 4. Sites Table
-- Stores operational sites where fuel is consumed
CREATE TABLE Sites (
    SiteID INT PRIMARY KEY IDENTITY(1,1),
    SiteName NVARCHAR(100) NOT NULL UNIQUE,
    TownshipID INT NOT NULL,
    LocationDetails NVARCHAR(255) NULL,
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Sites_Townships FOREIGN KEY (TownshipID) REFERENCES Townships(TownshipID)
);
GO

-- 5. Warehouses Table
-- Stores fuel storage facilities with different types and ID generation rules
CREATE TABLE Warehouses (
    WarehouseID INT PRIMARY KEY IDENTITY(1,1),
    WarehouseName NVARCHAR(100) NOT NULL,
    WarehouseType NVARCHAR(10) NOT NULL, -- e.g., 'WH1', 'WH2', 'WH3', 'WH4'
    -- GeneratedIDCode is unique and derived from specific rules (e.g., Postal Code, Sub-Office, Township, Site_ID)
    GeneratedIDCode NVARCHAR(100) NOT NULL UNIQUE,
    LocationDetails NVARCHAR(255) NULL,
    TownshipID INT NULL, -- Optional, for WH types linked to townships
    SiteID INT NULL, -- Optional, for WH4 type linked to a specific site
    SubOffice NVARCHAR(100) NULL, -- For WH2, WH3, WH4 ID generation
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Warehouses_Townships FOREIGN KEY (TownshipID) REFERENCES Townships(TownshipID),
    CONSTRAINT FK_Warehouses_Sites FOREIGN KEY (SiteID) REFERENCES Sites(SiteID),
    -- Constraint to ensure WarehouseType is one of the allowed values
    CONSTRAINT CK_Warehouse_Type CHECK (WarehouseType IN ('WH1', 'WH2', 'WH3', 'WH4'))
);
GO

-- 6. FuelPrices Table
-- Stores historical and current fuel prices, which can vary by date, supplier, township, or site
CREATE TABLE FuelPrices (
    FuelPriceID INT PRIMARY KEY IDENTITY(1,1),
    FuelTypeID INT NOT NULL,
    Price DECIMAL(18,4) NOT NULL,
    EffectiveDate DATE NOT NULL,
    SupplierID INT NULL, -- Optional: Price specific to a supplier
    TownshipID INT NULL, -- Optional: Price specific to a township
    SiteID INT NULL,     -- Optional: Price specific to a site
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_FuelPrices_FuelTypes FOREIGN KEY (FuelTypeID) REFERENCES FuelTypes(FuelTypeID),
    CONSTRAINT FK_FuelPrices_Suppliers FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    CONSTRAINT FK_FuelPrices_Townships FOREIGN KEY (TownshipID) REFERENCES Townships(TownshipID),
    CONSTRAINT FK_FuelPrices_Sites FOREIGN KEY (SiteID) REFERENCES Sites(SiteID),
    -- Ensures a unique price record for a given fuel type, date, and specific context (supplier, township, site)
    CONSTRAINT UQ_FuelPrices_TypeDateSupplierTownshipSite UNIQUE (FuelTypeID, EffectiveDate, SupplierID, TownshipID, SiteID)
);
GO

-- 7. PriceFluctuations Table
-- Records the calculated price changes based on new price entries
CREATE TABLE PriceFluctuations (
    FluctuationID INT PRIMARY KEY IDENTITY(1,1),
    FuelTypeID INT NOT NULL,
    FluctuationDate DATE NOT NULL,
    CurrentPrice DECIMAL(18,4) NOT NULL,
    PreviousPrice DECIMAL(18,4) NULL, -- NULL if no prior record
    FluctuationAmount DECIMAL(18,4) NULL, -- Calculated: CurrentPrice - PreviousPrice
    FluctuationType NVARCHAR(10) NULL, -- 'Increase', 'Decrease', 'No Change', or '-' if PreviousPrice is NULL
    Notes NVARCHAR(255) NULL,
    RecordedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PriceFluctuations_FuelTypes FOREIGN KEY (FuelTypeID) REFERENCES FuelTypes(FuelTypeID)
);
GO

-- 8. FuelTransactions Table
-- Records all fuel replenishment and transfer operations
CREATE TABLE FuelTransactions (
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    UsageTransitionID NVARCHAR(50) NOT NULL UNIQUE, -- Unique ID for each transaction
    TransactionType NVARCHAR(50) NOT NULL, -- 'Replenishment Process 1', 'Replenishment Process 2', 'Fuel Transfer Process'
    
    SourceLocationType NVARCHAR(20) NOT NULL, -- 'Supplier', 'Warehouse', 'Site'
    SourceLocationID INT NOT NULL, -- ID from Suppliers, Warehouses, or Sites table based on SourceLocationType
    
    DestinationLocationType NVARCHAR(20) NOT NULL, -- 'Warehouse', 'Site'
    DestinationLocationID INT NOT NULL, -- ID from Warehouses or Sites table based on DestinationLocationType
    
    FuelTypeID INT NOT NULL,
    Quantity DECIMAL(18,2) NOT NULL,
    TransactionDate DATETIME NOT NULL,
    FuelPriceID INT NULL, -- Link to the FuelPrices table for the price at the time of transaction
    TransportationCost DECIMAL(18,2) DEFAULT 0,
    LoadingUnloadingCost DECIMAL(18,2) DEFAULT 0,
    OtherCost DECIMAL(18,2) DEFAULT 0,
    -- Calculated column for total cost of the transaction
    TotalCost AS (Quantity * (SELECT Price FROM FuelPrices WHERE FuelPriceID = FuelTransactions.FuelPriceID) + TransportationCost + LoadingUnloadingCost + OtherCost) PERSISTED,
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_FuelTransactions_FuelTypes FOREIGN KEY (FuelTypeID) REFERENCES FuelTypes(FuelTypeID),
    CONSTRAINT FK_FuelTransactions_FuelPrices FOREIGN KEY (FuelPriceID) REFERENCES FuelPrices(FuelPriceID),
    
    -- Ensure valid SourceLocationType
    CONSTRAINT CK_SourceLocationType CHECK (SourceLocationType IN ('Supplier', 'Warehouse', 'Site')),
    -- Ensure valid DestinationLocationType
    CONSTRAINT CK_DestinationLocationType CHECK (DestinationLocationType IN ('Warehouse', 'Site'))
);
GO

-- 9. FuelInventory Table
-- Stores the current stock levels for each fuel type at each location
CREATE TABLE FuelInventory (
    InventoryID INT PRIMARY KEY IDENTITY(1,1),
    FuelTypeID INT NOT NULL,
    LocationType NVARCHAR(20) NOT NULL, -- 'Warehouse', 'Site'
    LocationID INT NOT NULL, -- ID from Warehouses or Sites table based on LocationType
    CurrentStock DECIMAL(18,2) NOT NULL DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE(),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_FuelInventory_LocationTypeID UNIQUE (FuelTypeID, LocationType, LocationID),
    CONSTRAINT FK_FuelInventory_FuelTypes FOREIGN KEY (FuelTypeID) REFERENCES FuelTypes(FuelTypeID),
    -- Ensure valid LocationType
    CONSTRAINT CK_InventoryLocationType CHECK (LocationType IN ('Warehouse', 'Site'))
);
GO

-- Create Indexes for performance optimization
CREATE INDEX IX_FuelPrices_FuelTypeID_EffectiveDate ON FuelPrices (FuelTypeID, EffectiveDate DESC);
CREATE INDEX IX_FuelTransactions_TransactionDate ON FuelTransactions (TransactionDate DESC);
CREATE INDEX IX_FuelTransactions_FuelTypeID ON FuelTransactions (FuelTypeID);
CREATE INDEX IX_FuelInventory_Location ON FuelInventory (LocationType, LocationID);
GO

-- Example Data Insertion (Optional, for testing)
/*
INSERT INTO FuelTypes (FuelTypeName, Description) VALUES
('Diesel', 'Standard Diesel Fuel'),
('Petrol', 'Unleaded Petrol');

INSERT INTO Townships (TownshipName, PostalCode, StateDivision) VALUES
('Yangon', '11181', 'Yangon Region'),
('Mandalay', '05011', 'Mandalay Region');

INSERT INTO Suppliers (SupplierName, ContactPerson) VALUES
('ABC Fuel Supply', 'U Kyaw Kyaw'),
('XYZ Petroleum', 'Daw Mya Mya');

INSERT INTO Sites (SiteName, TownshipID) VALUES
('Site A', 1),
('Site B', 2);

-- Example Warehouses (IDs would be generated by application logic or external system)
INSERT INTO Warehouses (WarehouseName, WarehouseType, GeneratedIDCode, TownshipID) VALUES
('Sagaing Main WH', 'WH1', 'SAGAING-PC123', NULL); -- Example for WH1, assuming postal code logic
INSERT INTO Warehouses (WarehouseName, WarehouseType, GeneratedIDCode, TownshipID, SubOffice) VALUES
('Mandalay Sub WH', 'WH2', 'MANDALAY-SO456', 2, 'SubOffice1'); -- Example for WH2
INSERT INTO Warehouses (WarehouseName, WarehouseType, GeneratedIDCode, TownshipID, SubOffice) VALUES
('Yangon City WH', 'WH3', 'YANGON-TOWN789', 1, 'SubOffice2'); -- Example for WH3
INSERT INTO Warehouses (WarehouseName, WarehouseType, GeneratedIDCode, TownshipID, SiteID) VALUES
('Site A Dedicated WH', 'WH4', 'SITEA-WH001', 1, 1); -- Example for WH4

-- Initial Inventory (Manual Adjustment)
INSERT INTO FuelInventory (FuelTypeID, LocationType, LocationID, CurrentStock) VALUES
(1, 'Warehouse', 1, 10000.00), -- Diesel at Sagaing Main WH
(2, 'Site', 1, 2000.00);      -- Petrol at Site A

-- Example Fuel Price Entry
INSERT INTO FuelPrices (FuelTypeID, Price, EffectiveDate, SupplierID, TownshipID) VALUES
(1, 1200.00, '2025-07-01', 1, 1),
(2, 1500.00, '2025-07-01', 2, NULL);

-- Example Fuel Transaction (Replenishment Process 1: Supplier to Warehouse)
-- Get the FuelPriceID for Diesel on 2025-07-01 (assuming it's the latest relevant price)
DECLARE @dieselPriceID INT;
SELECT @dieselPriceID = FuelPriceID FROM FuelPrices WHERE FuelTypeID = 1 AND EffectiveDate = '2025-07-01';

INSERT INTO FuelTransactions (UsageTransitionID, TransactionType, SourceLocationType, SourceLocationID, DestinationLocationType, DestinationLocationID, FuelTypeID, Quantity, TransactionDate, FuelPriceID, TransportationCost) VALUES
('TRANS-001', 'Replenishment Process 1', 'Supplier', 1, 'Warehouse', 1, 1, 5000.00, '2025-07-05 10:00:00', @dieselPriceID, 150.00);

-- Update inventory after transaction (this would be handled by application logic or trigger)
UPDATE FuelInventory
SET CurrentStock = CurrentStock + 5000.00, LastUpdated = GETDATE()
WHERE FuelTypeID = 1 AND LocationType = 'Warehouse' AND LocationID = 1;

-- Example Price Fluctuation (This would be calculated by application logic)
-- Assuming a new price for Diesel on 2025-07-10
INSERT INTO FuelPrices (FuelTypeID, Price, EffectiveDate, SupplierID, TownshipID) VALUES
(1, 1250.00, '2025-07-10', 1, 1);

-- Simulate fluctuation calculation:
-- Get previous price for Diesel before 2025-07-10
DECLARE @prevDieselPrice DECIMAL(18,4);
SELECT TOP 1 @prevDieselPrice = Price FROM FuelPrices
WHERE FuelTypeID = 1 AND EffectiveDate < '2025-07-10'
ORDER BY EffectiveDate DESC;

INSERT INTO PriceFluctuations (FuelTypeID, FluctuationDate, CurrentPrice, PreviousPrice, FluctuationAmount, FluctuationType) VALUES
(1, '2025-07-10', 1250.00, @prevDieselPrice, 1250.00 - @prevDieselPrice, CASE WHEN (1250.00 - @prevDieselPrice) > 0 THEN 'Increase' WHEN (1250.00 - @prevDieselPrice) < 0 THEN 'Decrease' ELSE 'No Change' END);
*/
