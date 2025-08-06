# Flask Backend Application (app.py)

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import os
from datetime import datetime
import uuid # For generating UsageTransitionID

# Initialize Flask app
app = Flask(__name__)
# Enable CORS for all origins, allowing frontend to connect
CORS(app)

# Database Configuration (replace with your actual SQL Server details)
# It's recommended to use environment variables for sensitive information
DB_CONFIG = {
    'DRIVER': '{ODBC Driver 17 for SQL Server}', # Or '{SQL Server}'
    'SERVER': os.getenv('DB_SERVER', 'localhost'), # e.g., 'your_server_name' or 'localhost'
    'DATABASE': os.getenv('DB_NAME', 'FuelInventoryDB'),
    'UID': os.getenv('DB_UID', 'your_username'), # Replace with your SQL Server username
    'PWD': os.getenv('DB_PWD', 'your_password')  # Replace with your SQL Server password
}

def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        conn_str = (
            f"DRIVER={DB_CONFIG['DRIVER']};"
            f"SERVER={DB_CONFIG['SERVER']};"
            f"DATABASE={DB_CONFIG['DATABASE']};"
            f"UID={DB_CONFIG['UID']};"
            f"PWD={DB_CONFIG['PWD']};"
        )
        conn = pyodbc.connect(conn_str)
        conn.autocommit = True # Auto-commit changes to the database
        return conn
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"Database connection error: {sqlstate} - {ex.args[1]}")
        return None

# --- API Endpoints ---

@app.route('/')
def home():
    """Basic home route to confirm API is running."""
    return "Fuel Inventory API is running!"

# --- Master Data Endpoints ---

@app.route('/api/fueltypes', methods=['GET'])
def get_fuel_types():
    """Fetches all fuel types."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT FuelTypeID, FuelTypeName, Description FROM FuelTypes")
        fuel_types = []
        for row in cursor.fetchall():
            fuel_types.append({
                "fuelTypeID": row.FuelTypeID,
                "fuelTypeName": row.FuelTypeName,
                "description": row.Description
            })
        return jsonify(fuel_types), 200
    except pyodbc.Error as ex:
        print(f"Error fetching fuel types: {ex}")
        return jsonify({"error": "Failed to fetch fuel types"}), 500
    finally:
        conn.close()

@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    """Fetches all suppliers."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT SupplierID, SupplierName, ContactPerson, ContactEmail, ContactPhone, Address, City, Country FROM Suppliers")
        suppliers = []
        for row in cursor.fetchall():
            suppliers.append({
                "supplierID": row.SupplierID,
                "supplierName": row.SupplierName,
                "contactPerson": row.ContactPerson,
                "contactEmail": row.ContactEmail,
                "contactPhone": row.ContactPhone,
                "address": row.Address,
                "city": row.City,
                "country": row.Country
            })
        return jsonify(suppliers), 200
    except pyodbc.Error as ex:
        print(f"Error fetching suppliers: {ex}")
        return jsonify({"error": "Failed to fetch suppliers"}), 500
    finally:
        conn.close()

@app.route('/api/townships', methods=['GET'])
def get_townships():
    """Fetches all townships."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT TownshipID, TownshipName, PostalCode, StateDivision FROM Townships")
        townships = []
        for row in cursor.fetchall():
            townships.append({
                "townshipID": row.TownshipID,
                "townshipName": row.TownshipName,
                "postalCode": row.PostalCode,
                "stateDivision": row.StateDivision
            })
        return jsonify(townships), 200
    except pyodbc.Error as ex:
        print(f"Error fetching townships: {ex}")
        return jsonify({"error": "Failed to fetch townships"}), 500
    finally:
        conn.close()

@app.route('/api/sites', methods=['GET'])
def get_sites():
    """Fetches all sites."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT SiteID, SiteName, TownshipID, LocationDetails, Latitude, Longitude FROM Sites")
        sites = []
        for row in cursor.fetchall():
            sites.append({
                "siteID": row.SiteID,
                "siteName": row.SiteName,
                "townshipID": row.TownshipID,
                "locationDetails": row.LocationDetails,
                "latitude": str(row.Latitude) if row.Latitude else None, # Convert Decimal to string
                "longitude": str(row.Longitude) if row.Longitude else None
            })
        return jsonify(sites), 200
    except pyodbc.Error as ex:
        print(f"Error fetching sites: {ex}")
        return jsonify({"error": "Failed to fetch sites"}), 500
    finally:
        conn.close()

@app.route('/api/warehouses', methods=['GET'])
def get_warehouses():
    """Fetches all warehouses."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT WarehouseID, WarehouseName, WarehouseType, GeneratedIDCode, LocationDetails, TownshipID, SiteID, SubOffice FROM Warehouses")
        warehouses = []
        for row in cursor.fetchall():
            warehouses.append({
                "warehouseID": row.WarehouseID,
                "warehouseName": row.WarehouseName,
                "warehouseType": row.WarehouseType,
                "generatedIDCode": row.GeneratedIDCode,
                "locationDetails": row.LocationDetails,
                "townshipID": row.TownshipID,
                "siteID": row.SiteID,
                "subOffice": row.SubOffice
            })
        return jsonify(warehouses), 200
    except pyodbc.Error as ex:
        print(f"Error fetching warehouses: {ex}")
        return jsonify({"error": "Failed to fetch warehouses"}), 500
    finally:
        conn.close()

# --- Fuel Price Endpoints ---

@app.route('/api/fuelprices', methods=['POST'])
def add_fuel_price():
    """Adds a new fuel price and calculates fluctuation."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON data"}), 400

    fuel_type_id = data.get('fuelTypeID')
    price = data.get('price')
    effective_date_str = data.get('effectiveDate')
    supplier_id = data.get('supplierID')
    township_id = data.get('townshipID')
    site_id = data.get('siteID')

    if not all([fuel_type_id, price, effective_date_str]):
        return jsonify({"error": "Missing required fields: fuelTypeID, price, effectiveDate"}), 400

    try:
        effective_date = datetime.strptime(effective_date_str, '%Y-%m-%d').date()
        price = float(price)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid data types for price or effectiveDate"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()

    try:
        # 1. Insert new fuel price
        cursor.execute(
            "INSERT INTO FuelPrices (FuelTypeID, Price, EffectiveDate, SupplierID, TownshipID, SiteID) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            fuel_type_id, price, effective_date, supplier_id, township_id, site_id
        )
        conn.commit() # Commit the price insertion

        # 2. Calculate and record price fluctuation
        previous_price = None
        fluctuation_amount = None
        fluctuation_type = '-'

        # Find the most recent previous price for the same fuel type
        cursor.execute(
            "SELECT TOP 1 Price FROM FuelPrices "
            "WHERE FuelTypeID = ? AND EffectiveDate < ? "
            "ORDER BY EffectiveDate DESC",
            fuel_type_id, effective_date
        )
        prev_row = cursor.fetchone()
        if prev_row:
            previous_price = prev_row.Price
            fluctuation_amount = price - previous_price
            if fluctuation_amount > 0:
                fluctuation_type = 'Increase'
            elif fluctuation_amount < 0:
                fluctuation_type = 'Decrease'
            else:
                fluctuation_type = 'No Change'

        cursor.execute(
            "INSERT INTO PriceFluctuations (FuelTypeID, FluctuationDate, CurrentPrice, PreviousPrice, FluctuationAmount, FluctuationType) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            fuel_type_id, effective_date, price, previous_price, fluctuation_amount, fluctuation_type
        )
        conn.commit() # Commit the fluctuation insertion

        return jsonify({"message": "Fuel price added and fluctuation recorded successfully"}), 201
    except pyodbc.Error as ex:
        print(f"Error adding fuel price: {ex}")
        conn.rollback() # Rollback in case of error
        return jsonify({"error": "Failed to add fuel price"}), 500
    finally:
        conn.close()

@app.route('/api/pricefluctuations', methods=['GET'])
def get_price_fluctuations():
    """Fetches price fluctuations."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT pf.FluctuationID, ft.FuelTypeName, pf.FluctuationDate, pf.CurrentPrice,
                   pf.PreviousPrice, pf.FluctuationAmount, pf.FluctuationType, pf.Notes
            FROM PriceFluctuations pf
            JOIN FuelTypes ft ON pf.FuelTypeID = ft.FuelTypeID
            ORDER BY pf.FluctuationDate DESC
        """)
        fluctuations = []
        for row in cursor.fetchall():
            fluctuations.append({
                "fluctuationID": row.FluctuationID,
                "fuelTypeName": row.FuelTypeName,
                "fluctuationDate": row.FluctuationDate.isoformat(),
                "currentPrice": float(row.CurrentPrice),
                "previousPrice": float(row.PreviousPrice) if row.PreviousPrice else None,
                "fluctuationAmount": float(row.FluctuationAmount) if row.FluctuationAmount else None,
                "fluctuationType": row.FluctuationType,
                "notes": row.Notes
            })
        return jsonify(fluctuations), 200
    except pyodbc.Error as ex:
        print(f"Error fetching price fluctuations: {ex}")
        return jsonify({"error": "Failed to fetch price fluctuations"}), 500
    finally:
        conn.close()


# --- Fuel Transaction Endpoints ---

@app.route('/api/fueltransactions', methods=['POST'])
def add_fuel_transaction():
    """Adds a new fuel transaction (replenishment or transfer) and updates inventory."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON data"}), 400

    # Required fields
    transaction_type = data.get('transactionType')
    source_location_type = data.get('sourceLocationType')
    source_location_id = data.get('sourceLocationID')
    destination_location_type = data.get('destinationLocationType')
    destination_location_id = data.get('destinationLocationID')
    fuel_type_id = data.get('fuelTypeID')
    quantity = data.get('quantity')
    transaction_date_str = data.get('transactionDate')
    fuel_price_id = data.get('fuelPriceID') # This should come from frontend or be looked up

    # Optional fields
    transportation_cost = data.get('transportationCost', 0)
    loading_unloading_cost = data.get('loadingUnloadingCost', 0)
    other_cost = data.get('otherCost', 0)
    notes = data.get('notes')

    if not all([transaction_type, source_location_type, source_location_id,
                destination_location_type, destination_location_id,
                fuel_type_id, quantity, transaction_date_str]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        quantity = float(quantity)
        transaction_date = datetime.strptime(transaction_date_str, '%Y-%m-%dT%H:%M:%S.%fZ') # ISO format from JS
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid data types for quantity or transactionDate"}), 400

    if quantity <= 0:
        return jsonify({"error": "Quantity must be positive"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()

    try:
        # Start a transaction for atomicity
        conn.autocommit = False

        # Generate unique UsageTransitionID
        usage_transition_id = f"TRANS-{uuid.uuid4()}"

        # 1. Validate Source Stock (if source is a Warehouse or Site)
        if source_location_type in ['Warehouse', 'Site']:
            cursor.execute(
                "SELECT CurrentStock FROM FuelInventory WHERE FuelTypeID = ? AND LocationType = ? AND LocationID = ?",
                fuel_type_id, source_location_type, source_location_id
            )
            source_stock_row = cursor.fetchone()
            if not source_stock_row or source_stock_row.CurrentStock < quantity:
                conn.rollback()
                return jsonify({"error": "Insufficient stock at source location"}), 400

        # 2. Insert into FuelTransactions
        cursor.execute(
            "INSERT INTO FuelTransactions (UsageTransitionID, TransactionType, SourceLocationType, SourceLocationID, "
            "DestinationLocationType, DestinationLocationID, FuelTypeID, Quantity, TransactionDate, FuelPriceID, "
            "TransportationCost, LoadingUnloadingCost, OtherCost, Notes) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            usage_transition_id, transaction_type, source_location_type, source_location_id,
            destination_location_type, destination_location_id, fuel_type_id, quantity, transaction_date, fuel_price_id,
            transportation_cost, loading_unloading_cost, other_cost, notes
        )

        # 3. Update FuelInventory (Decrease Source Stock)
        if source_location_type in ['Warehouse', 'Site']:
            cursor.execute(
                "UPDATE FuelInventory SET CurrentStock = CurrentStock - ?, LastUpdated = GETDATE() "
                "WHERE FuelTypeID = ? AND LocationType = ? AND LocationID = ?",
                quantity, fuel_type_id, source_location_type, source_location_id
            )

        # 4. Update FuelInventory (Increase Destination Stock)
        cursor.execute(
            "MERGE FuelInventory AS target "
            "USING (VALUES (?, ?, ?, ?)) AS source (FuelTypeID, LocationType, LocationID, Quantity) "
            "ON (target.FuelTypeID = source.FuelTypeID AND target.LocationType = source.LocationType AND target.LocationID = source.LocationID) "
            "WHEN MATCHED THEN "
            "    UPDATE SET CurrentStock = target.CurrentStock + source.Quantity, LastUpdated = GETDATE() "
            "WHEN NOT MATCHED THEN "
            "    INSERT (FuelTypeID, LocationType, LocationID, CurrentStock, LastUpdated) VALUES (source.FuelTypeID, source.LocationType, source.LocationID, source.Quantity, GETDATE());",
            fuel_type_id, destination_location_type, destination_location_id, quantity
        )

        conn.commit() # Commit all changes if successful
        return jsonify({"message": "Fuel transaction added and inventory updated successfully", "usageTransitionID": usage_transition_id}), 201

    except pyodbc.Error as ex:
        print(f"Error adding fuel transaction: {ex}")
        conn.rollback() # Rollback in case of error
        return jsonify({"error": "Failed to add fuel transaction"}), 500
    finally:
        conn.autocommit = True # Reset autocommit
        conn.close()

@app.route('/api/fuelinventory', methods=['GET'])
def get_fuel_inventory():
    """Fetches current fuel inventory levels."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT fi.InventoryID, ft.FuelTypeName, fi.LocationType,
                   CASE
                       WHEN fi.LocationType = 'Warehouse' THEN w.WarehouseName
                       WHEN fi.LocationType = 'Site' THEN s.SiteName
                       ELSE 'Unknown'
                   END AS LocationName,
                   fi.CurrentStock, fi.LastUpdated
            FROM FuelInventory fi
            JOIN FuelTypes ft ON fi.FuelTypeID = ft.FuelTypeID
            LEFT JOIN Warehouses w ON fi.LocationType = 'Warehouse' AND fi.LocationID = w.WarehouseID
            LEFT JOIN Sites s ON fi.LocationType = 'Site' AND fi.LocationID = s.SiteID
            ORDER BY ft.FuelTypeName, LocationName
        """)
        inventory = []
        for row in cursor.fetchall():
            inventory.append({
                "inventoryID": row.InventoryID,
                "fuelTypeName": row.FuelTypeName,
                "locationType": row.LocationType,
                "locationName": row.LocationName,
                "currentStock": float(row.CurrentStock),
                "lastUpdated": row.LastUpdated.isoformat()
            })
        return jsonify(inventory), 200
    except pyodbc.Error as ex:
        print(f"Error fetching fuel inventory: {ex}")
        return jsonify({"error": "Failed to fetch fuel inventory"}), 500
    finally:
        conn.close()

@app.route('/api/fueltransactions', methods=['GET'])
def get_fuel_transactions():
    """Fetches all fuel transactions."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                ftrans.TransactionID,
                ftrans.UsageTransitionID,
                ftrans.TransactionType,
                ftrans.SourceLocationType,
                CASE
                    WHEN ftrans.SourceLocationType = 'Supplier' THEN s.SupplierName
                    WHEN ftrans.SourceLocationType = 'Warehouse' THEN w_src.WarehouseName
                    WHEN ftrans.SourceLocationType = 'Site' THEN site_src.SiteName
                    ELSE 'N/A'
                END AS SourceLocationName,
                ftrans.DestinationLocationType,
                CASE
                    WHEN ftrans.DestinationLocationType = 'Warehouse' THEN w_dest.WarehouseName
                    WHEN ftrans.DestinationLocationType = 'Site' THEN site_dest.SiteName
                    ELSE 'N/A'
                END AS DestinationLocationName,
                ftype.FuelTypeName,
                ftrans.Quantity,
                ftrans.TransactionDate,
                fp.Price AS FuelPricePerUnit,
                ftrans.TransportationCost,
                ftrans.LoadingUnloadingCost,
                ftrans.OtherCost,
                ftrans.TotalCost,
                ftrans.Notes
            FROM FuelTransactions ftrans
            JOIN FuelTypes ftype ON ftrans.FuelTypeID = ftype.FuelTypeID
            LEFT JOIN Suppliers s ON ftrans.SourceLocationType = 'Supplier' AND ftrans.SourceLocationID = s.SupplierID
            LEFT JOIN Warehouses w_src ON ftrans.SourceLocationType = 'Warehouse' AND ftrans.SourceLocationID = w_src.WarehouseID
            LEFT JOIN Sites site_src ON ftrans.SourceLocationType = 'Site' AND ftrans.SourceLocationID = site_src.SiteID
            LEFT JOIN Warehouses w_dest ON ftrans.DestinationLocationType = 'Warehouse' AND ftrans.DestinationLocationID = w_dest.WarehouseID
            LEFT JOIN Sites site_dest ON ftrans.DestinationLocationType = 'Site' AND ftrans.DestinationLocationID = site_dest.SiteID
            LEFT JOIN FuelPrices fp ON ftrans.FuelPriceID = fp.FuelPriceID
            ORDER BY ftrans.TransactionDate DESC
        """)
        transactions = []
        for row in cursor.fetchall():
            transactions.append({
                "transactionID": row.TransactionID,
                "usageTransitionID": row.UsageTransitionID,
                "transactionType": row.TransactionType,
                "sourceLocationType": row.SourceLocationType,
                "sourceLocationName": row.SourceLocationName,
                "destinationLocationType": row.DestinationLocationType,
                "destinationLocationName": row.DestinationLocationName,
                "fuelTypeName": row.FuelTypeName,
                "quantity": float(row.Quantity),
                "transactionDate": row.TransactionDate.isoformat(),
                "fuelPricePerUnit": float(row.FuelPricePerUnit) if row.FuelPricePerUnit else None,
                "transportationCost": float(row.TransportationCost),
                "loadingUnloadingCost": float(row.LoadingUnloadingCost),
                "otherCost": float(row.OtherCost),
                "totalCost": float(row.TotalCost) if row.TotalCost else None,
                "notes": row.Notes
            })
        return jsonify(transactions), 200
    except pyodbc.Error as ex:
        print(f"Error fetching fuel transactions: {ex}")
        return jsonify({"error": "Failed to fetch fuel transactions"}), 500
    finally:
        conn.close()


# --- Main execution block ---
if __name__ == '__main__':
    # To run this Flask app:
    # 1. Make sure you have Flask and pyodbc installed:
    #    pip install Flask pyodbc
    # 2. Set environment variables for DB_SERVER, DB_NAME, DB_UID, DB_PWD
    #    (or hardcode them in DB_CONFIG for local testing, but not for production)
    # 3. Run from your terminal: python app.py
    # This will run on http://127.0.0.1:5000/ by default
    app.run(debug=True) # debug=True for development, turn off for production
