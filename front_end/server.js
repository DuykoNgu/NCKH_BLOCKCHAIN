import jsonServer from 'json-server'
import crypto from 'crypto'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// Lưu trữ nonce trong memory (trong production, dùng Redis/database)
const nonces = new Map()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Đăng ký ví Web3 - nhận public_key, address, role
server.post('/auth/wallet/register', (req, res) => {
  console.log('Web3 Register route hit', req.body)
  const { public_key, address, role } = req.body

  if (!public_key || !address || !role) {
    return res.status(400).json({ error: 'Missing required fields: public_key, address, role' })
  }

  const data = {
    user_id: crypto.randomBytes(16).toString('hex'),
    public_key: public_key,
    address: address,
    role: role
  }
  console.log('Web3 Registration successful:', data)
  res.json(data)
})

// Yêu cầu nonce để đăng nhập bằng chữ ký
server.post('/auth/nonce', (req, res) => {
  console.log('Nonce request hit', req.body)
  const { address } = req.body

  if (!address) {
    return res.status(400).json({ error: 'Missing address' })
  }

  // Tạo nonce ngẫu nhiên
  const nonce = crypto.randomBytes(32).toString('hex')

  // Lưu nonce với address (trong production, thêm expiration)
  nonces.set(address, nonce)

  console.log(`Generated nonce for ${address}: ${nonce}`)
  res.json({ nonce })
})

// Đăng nhập ví Web3 - nhận address, signature
server.post('/auth/wallet/login', (req, res) => {
  console.log('Web3 Login route hit', req.body)
  const { address, signature } = req.body

  if (!address || !signature) {
    return res.status(400).json({ error: 'Missing required fields: address, signature' })
  }

  // Trong implementation thực, bạn sẽ:
  // 1. Lấy nonce đã lưu cho address này
  // 2. Verify chữ ký với nonce sử dụng public_key đã lưu
  // 3. Kiểm tra nonce chưa hết hạn

  const storedNonce = nonces.get(address)
  if (!storedNonce) {
    return res.status(401).json({ error: 'No nonce found for this address. Please request nonce first.' })
  }

  // Để mock, chấp nhận mọi chữ ký
  // Trong production: verify chữ ký với secp256k1.verify(signature, messageHash, publicKey)

  console.log(`Web3 Login successful for ${address} with signature: ${signature.substring(0, 20)}...`)

  // Xóa nonce đã sử dụng
  nonces.delete(address)

  // Trả về mock JWT response
  res.json({
    access_token: "mock_jwt_" + crypto.randomBytes(16).toString('hex'),
    token_type: "bearer",
    user_id: crypto.randomBytes(8).toString('hex'),
    public_key: "mock_public_key_" + crypto.randomBytes(16).toString('hex'),
    address: address,
    role: "user"
  })
})

server.use(router)

server.listen(3003, () => {
  console.log('JSON Server đang chạy trên port 3003 (Web3 Wallet Mock Backend)')
  console.log('Các endpoint có sẵn:')
  console.log('  POST /auth/wallet/register - Đăng ký với public_key, address, role')
  console.log('  POST /auth/nonce - Yêu cầu nonce cho address')
  console.log('  POST /auth/wallet/login - Đăng nhập với address, signature')
})