from controllers import router
if __name__ == "__main__":
    
    router.app.run(host="127.0.0.1", port=5000, debug=True)