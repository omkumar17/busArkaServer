const express = require('.pnpm/express@4.21.0/node_modules/express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const url = process.env.MONGODB_URI;

const client = new MongoClient(url);

const dbName = database;

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



client.connect();
const db = client.db(dbName);
const collection = db.collection('user');
const collectionAttend = db.collection(`bus`);

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.post('/Login', async (req, res) => {
    try {

        const { enrollment, password, userType } = req.body;
        const user = await collection.findOne({ enrollment });

        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or password user' });
        }

        if (userType !== user.userType) {
            return res.status(401).json({ message: 'Invalid ID or user type type' });
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid ID or password password' });
        }


        res.send({ success: true, message: 'Login successful', userType,  enrollment: user.enrollment,firstName:user.firstName });


    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});

app.post('/LoginOtp', async (req, res) => {
    try {

        const { email, phone, userType, otp, systemOtp } = req.body;
        // console.log("dataServer",data);
        let user = '';
        if (email) {
            user = await collection.findOne({ email });
        }
        else if (phone) {
            user = await collection.findOne({ phone });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or password user' });
        }

        if (userType !== user.userType) {
            return res.status(401).json({ message: 'Invalid ID or user type type' });
        }
        if (otp && systemOtp) {
            if (otp === systemOtp) {

                return res.status(201).json({ message: 'otp successfully verified', userType: user.userType, name: user.firstName, enrollment: user.enrollment });

            }
            else {

                return res.status(202).json({ message: 'invalid otp' });
            }
        }
        res.send({ success: true, message: 'Login successful', userType, name: user.firstName, enrollment: user.enrollment });



    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});

app.post('/register', async (req, res) => {
    const formData = req.body;


    const user = await collection.findOne({ enrollment: formData.enrollment, email: formData.email, mobile: formData.mobile }); 
    if (user) {
        return res.status(410).json({ message: 'User already present' });
    }

    try {

        const hashedPassword = await bcrypt.hash(formData.password, 10);


        const newUser = {
            ...formData,
            password: hashedPassword,
        };

        console.log('Received form data:', newUser);


        const result = await collection.insertOne(newUser);
        res.send({ success: true, result: result });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});


app.get('/details', async (req, res) => {
    try {
        const user = await collection.find({}).toArray(); 
        if (user.length > 0) {
            res.status(200).send({ success: true, message: 'Data fetched', user });
        } else {
            res.status(404).json({ success: false, message: 'No data found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.put('/details', async (req, res) => {
    try {
        const data = req.body; 
        
        // Ensure email is provided in the request
        if (!data.email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const findResult = await collection.updateOne(
            { email: data.email },
            { 
                $set: {
                    email: data.email,
                    branch: data.branch,  
                    phone: data.phone,
                    location: data.location,
                    session: data.session,
                    status: data.status,
                    reason: data.reason 
                } 
            }
        );

        
        if (findResult.modifiedCount === 0) {
            return res.status(404).json({ message: 'No document found to update' });
        }

        res.send({ success: true, result: findResult });
    } catch (error) {
        console.error('Error editing documents:', error);
        res.status(500).json({ message: 'An error occurred while editing documents' });
    }
});


app.get('/api/check-rfid', async(req, res) => {
    const { rfid } = req.query; 
  
    if (!rfid) {
      return res.status(400).json({ message: 'RFID is required' }); 
    }
  
    
    const student = await collection.findOne({ rfid });
  
    if (student) {
    
      res.status(200).json({
        rfid: student.rfid,
        totalrow: 1,
        data: [
          {
            name: student.name,
            enrollment: student.enrollment,
            branch: student.branch,
            session: student.session
          }
        ]
      });
    } else {
      
      res.status(200).json({
        rfid: rfid,
        totalrow: 0,
        data: []
      });
    }
  });



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
