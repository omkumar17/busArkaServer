const express = require('.pnpm/express@4.21.0/node_modules/express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const url = process.env.MONGODB_URI;

const client = new MongoClient(url);
// const client = new MongoClient('mongodb://localhost:27017/');

const dbName = process.env.DATABASE;
// const dbName = 'busData';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



client.connect();
const db = client.db(dbName);
const collection = db.collection('user');
const busDetails = db.collection(`busDetails`);
const studentLog = db.collection(`studentLogs`);

app.get('/', (req, res) => {
    res.send('Hello World!');
}); 


app.post('/Login', async (req, res) => {
    try {

        const { email, password, userType } = req.body;
        console.log(userType);
        console.log(email);
        console.log(password);
        const user = await collection.findOne({ email });

        console.log("user",user);
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


        res.send({ success: true, message: 'Login successful', userType,  enrollment: user.enrollment, email:user.email,firstName:user.firstName });


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
  
    
    const student = await collection.find({ rfid }).toArray();

  
    if (student.length>=1) {
    
      res.status(200).json({
        rfid: student[0].rfid,
        totalrow: student.length,
        data: [
          {
            name: student[0].name,
            enrollment: student[0].enrollment,
            branch: student[0].branch,
            session: student[0].session
          }
        ]
      });
    } 
    // else if(student.length>1){
    //     res.status(402).json({
    //         rfid:rfid,
    //         totalrow:student.length
    //     })
    // }
    else {
      
      res.status(300).json({
        rfid: rfid,
        totalrow: 0,
        data: []
      });
    }
  });

  app.post('/api/rfid/check', async (req, res) => {
    const { rfid_code, bus_no } = req.body;
    console.log(rfid_code);
    try {
        // Check if student exists
        const student = await studentLog.findOne({ rfid: rfid_code });
        if (!student) {
            return res.status(404).json({
                error: true,
                message: 'Invalid RFID: Student not found.'
            });
        }

        const location = await busDetails.findOne( {bus_no:bus_no});
        if (!location) {
            return res.status(404).json({
                error: true,
                message: 'Invalid location: location not available.'
            });
        }
    
        if (!student.current) {
            const now = new Date();
            const boardData = {
                lat: location.latitude,
                long: location.longitude, 
                date: now.toLocaleDateString('en-IN'), 
                time: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) 
            };
    
            // Update the document
            const result = await studentLog.updateOne(
                { rfid: rfid_code },
                {
                    $set: {
                        current: bus_no,
                        status: "boarded"
                    },
                    $push: {
                        logs: {
                            busno: bus_no,
                            board: boardData,
                            left:{}
                        }
                    }
                }
            );
    
            if (result.modifiedCount === 1) {
                return res.status(200).json({
                    error: false,
                    message: 'Log entry created, student has boarded the bus.'
                });
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Failed to update student log.'
                });
            }
        } else {
            const now = new Date();
            const leftData = {
                lat: location.latitude, 
                long: location.longitude, 
                date: now.toLocaleDateString('en-IN'), 
                time: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) 
            };
    
            
            const result = await studentLog.updateOne(
                { rfid: rfid_code },
                {
                    $set: {
                        current: '',
                        status: "left",
                        [`logs.${student.logs.length - 1}.left`]: leftData
                    },
                   
                }
            );
    
            if (result.modifiedCount === 1) {
                return res.status(200).json({
                    error: false,
                    message: 'Log entry created, student has left the bus.'
                });
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Failed to update student log.'
                });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: true,
            message: 'Internal server error.'
        });
    }
});

app.post('/api/bus_location/update', async (req, res) => {
    const { bus_no, latitude, longitude } = req.body;

    try {
        // Check if bus exists in the database
        const bus = await busDetails.findOne({ bus_no });

        if (!bus) {
            return res.status(404).json({
                error: true,
                message: 'Bus not found.'
            });
        }

        // Update the bus's latitude and longitude
        const result = await busDetails.updateOne(
            { bus_no },
            {
                $set: {
                    latitude,
                    longitude
                }
            }
        );

        if (result.modifiedCount === 1) {
            return res.status(200).json({
                error: false,
                message: 'Bus location updated successfully.'
            });
        } else {
            return res.status(500).json({
                error: true,
                message: 'Failed to update bus location.'
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: true,
            message: 'Internal server error.'
        });
    }
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
