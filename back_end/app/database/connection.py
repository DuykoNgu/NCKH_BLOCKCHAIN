import sqlite3

DATABASE_URL = "sqlite:///./app/database/educhain.db"
conn = sqlite3.connect("./app/database/NCKH_educhain.db")
cursor = conn.cursor()
print("Database connected successfully")
conn.close()
     

"""TEST CONNECTION"""
query = """CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT )"""
     
cursor.execute(query)
result = cursor.fetchall()
print(result)
conn.commit()

        
        