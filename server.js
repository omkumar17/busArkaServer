const express = require('.pnpm/express@4.21.0/node_modules/express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');

const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

const url = process.env.MONGODB_URI;

const client = new MongoClient(url);
// const client = new MongoClient('mongodb://localhost:27017/');

const dbName = process.env.DATABASE;
// const dbName = 'busData';
dotenv.config();
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
const contactsCollection = db.collection(`contacts`);
const noticeCollection = db.collection(`notice`);
const feedback = db.collection(`feedback`);
const fees = db.collection(`fee`);

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.post('/Login', async (req, res) => {
    try {

        const { email, password, userType } = req.body;
        console.log(userType);
        console.log(email);
        console.log(password);
        const user = await collection.findOne({ email: email });

        console.log("user", user);
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


        res.send({ success: true, message: 'Login successful', userType, email: user.email, firstName: user.firstName });


    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});

app.post('/LoginOtp', async (req, res) => {
    try {

        const { email, userType, otp, systemOtp } = req.body;
        // console.log("dataServer",data);
        let user = '';
        if (email) {
            user = await collection.findOne({ email,userType });
        }


        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or password user' });
        }

        if (userType !== user.userType) {
            return res.status(401).json({ message: 'Invalid ID or user type type' });
        }
        if (otp && systemOtp) {
            if (otp === systemOtp) {

                return res.status(201).json({ message: 'otp successfully verified', userType: user.userType, name: user.firstName, email: user.email });

            }
            else {

                return res.status(202).json({ message: 'invalid otp' });
            }
        }
        res.send({ success: true, message: 'Login successful', userType, name: user.firstName, email: user.email });



    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});

app.post('/StudentLogin', async (req, res) => {
    try {

        const { enrollment, password, userType } = req.body;
        console.log(userType);
        console.log(enrollment);
        console.log(password);
        const user = await collection.findOne({ enrollment: enrollment });

        console.log("user", user);
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


        res.send({ success: true, message: 'Login successful', userType, enrollment: user.enrollment, email: user.email, firstName: user.firstName });


    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'An error occurred while fetching documents' });
    }
});

app.post('/StudentLoginOtp', async (req, res) => {
    try {

        const { enrollment, email, userType, otp, systemOtp } = req.body;
        // console.log("dataServer",data);
        let user = '';
        if (email && enrollment) {
            user = await collection.findOne({ email, enrollment });
        }


        if (!user) {
            return res.status(401).json({ message: 'Invalid ID or password user' });
        }

        if (userType !== user.userType) {
            return res.status(401).json({ message: 'Invalid ID or user type type' });
        }
        if (otp && systemOtp) {
            if (otp === systemOtp) {

                return res.status(201).json({ message: 'otp successfully verified', email: user.email, userType: user.userType, name: user.firstName, enrollment: user.enrollment });

            }
            else {

                return res.status(202).json({ message: 'invalid otp' });
            }
        }
        res.send({ success: true, message: 'Login successful', email: user.email, userType, name: user.firstName, enrollment: user.enrollment });



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
    const emailcheck = await collection.findOne({ email: formData.email });
    if (emailcheck) {
        return res.status(410).json({ message: 'User already present' });
    }
    const mobilecheck = await collection.findOne({ mobile: formData.mobile });
    if (mobilecheck) {
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
        const user = await collection.find({ userType: 'student' }).toArray();
        if (user.length > 0) {
            res.status(200).send({ success: true, message: 'Data fetched', user });
        } else {
            res.status(404).json({ success: false, message: 'No data found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.post('/profiledetails', async (req, res) => {
    const { enrollment } = req.body;
    try {
        const user = await collection.find({ enrollment }).toArray();
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
        console.log(data);
        // Ensure email is provided in the request
        if (!data.email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const findResult = await collection.updateOne(
            { enrollment: data.enrollment },
            {
                $set: {
                    firstName:data.firstName,
                    lastName:data.lastName,
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
        console.log(findResult)

        if (findResult.modifiedCount === 0) {
            return res.status(404).json({ message: 'No document found to update' });
        }

        res.send({ success: true, result: findResult });
    } catch (error) {
        console.error('Error editing documents:', error);
        res.status(500).json({ message: 'An error occurred while editing documents' });
    }
});

app.get('/busdetails', async (req, res) => {
    try {
        const bus = await busDetails.find({}).toArray();

        if (bus.length > 0) {
            res.status(200).send({ success: true, message: 'Data fetched', bus });
        } else {
            res.status(404).json({ success: false, message: 'No data found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.post('/busdetails', async (req, res) => {
    const { id,reg_no, bus_no, destination,route, seatCount, peopleCount } = req.body;

    // Validate the input
    console.log("data", id, bus_no, );


    try {
        // Insert the bus details into the "buses" collection
        const result = await busDetails.insertOne({
            id,
            reg_no,
            bus_no,
            destination,
            route,
            seatCount,
            peopleCount,
            
        });

        return res.status(200).json({ success: true, message: 'Bus details added successfully!', busId: result.insertedId });
    } catch (error) {
        console.error('Error inserting bus details:', error);
        return res.status(500).json({ success: false, message: 'Failed to add bus details.' });
    }
});

// DELETE endpoint for bus details
app.delete('/busdetails/:id', async (req, res) => {
    const busId = req.params.id;

    try {
        // Ensure the ID is a valid ObjectId


        const result = await busDetails.deleteOne({ id: busId });

        if (result.deletedCount === 1) {
            return res.status(200).json({ message: 'Bus details deleted successfully!' });
        } else {
            return res.status(404).json({ message: 'Bus not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete bus details' });
    }
});

app.put('/busdetails/:id', async (req, res) => {
    const busId = req.params.id;
    let updateData = req.body;

    console.log('data', updateData);
    console.log('id', busId);

    // Remove the _id field if it exists in updateData
    delete updateData._id;

    try {
        // Find and update the document by id
        const result = await busDetails.updateOne(
            { id: busId }, // Assuming 'id' is the field you want to match
            { $set: updateData }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ success: true, message: 'Bus details updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Bus not found or no changes made' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating bus details' });
    }
});



app.get('/api/check-rfid', async (req, res) => {
    const { rfid } = req.query;

    if (!rfid) {
        return res.status(400).json({ message: 'RFID is required' });
    }


    const student = await collection.find({ rfid }).toArray();


    if (student.length >= 1) {

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
    const { rfid_code, reg_no } = req.body;
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

        const location = await busDetails.findOne({ reg_no: reg_no });
        if (!location) {
            return res.status(404).json({
                error: true,
                message: 'Invalid location: location not available.'
            });
        }

        const now = new Date();
        // Format date to dd-mm-yyyy
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

        // Convert time to Asia/Kolkata timezone
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const formattedTime = now.toLocaleTimeString('en-IN', options);

        if (!student.current) {
            const boardData = {
                lat: location.latitude,
                long: location.longitude,
                date: formattedDate,
                time: formattedTime
            };

            // Update the document
            const result = await studentLog.updateOne(
                { rfid: rfid_code },
                {
                    $set: {
                        current: reg_no,
                        status: "boarded"
                    },
                    $push: {
                        logs: {
                            busno: reg_no,
                            board: boardData,
                            left: {}
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
            const leftData = {
                lat: location.latitude,
                long: location.longitude,
                date: formattedDate,
                time: formattedTime
            };

            const result = await studentLog.updateOne(
                { rfid: rfid_code },
                {
                    $set: {
                        current: '',
                        status: "left",
                        [`logs.${student.logs.length - 1}.left`]: leftData
                    }
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
    const { reg_no, latitude, longitude } = req.body;

    try {
        // Check if bus exists in the database
        const bus = await busDetails.findOne({ reg_no });

        if (!bus) {
            return res.status(404).json({
                error: true,
                message: 'Bus not found.'
            });
        }

        // Update the bus's latitude and longitude
        const result = await busDetails.updateOne(
            { reg_no },
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

app.get('/punchlog', async (req, res) => {
    try {
        const body = req.query;
        const enrollment = body.enrollment;
        console.log(body.enrollment);

        if (!body.enrollment) {
            return res.status(400).json({ success: false, message: "Enrollment query parameter is required" });
        }

        // Find logs based on the enrollment query
        const logs = await studentLog.find({ enrollment }).toArray();
        console.log(logs);

        if (!logs || logs.length === 0) {
            return res.status(404).json({ success: false, message: "No logs found for this enrollment" });
        }

        res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching punch log data:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await contactsCollection.find({}).toArray();
        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to insert a new contact
app.post('/api/contacts', async (req, res) => {
    try {
        const { id, name, designation, email, contact } = req.body;
        const newContact = { id, name, designation, email, contact };

        const result = await contactsCollection.insertOne(newContact);
        res.status(201).json(result); // Return the newly created contact
    } catch (error) {
        console.error('Error inserting contact:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to update an existing contact
app.put('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params; // Destructure to get id from req.params
        const { name, designation, email, contact } = req.body;

        const result = await contactsCollection.updateOne(
            { id: id }, // Match the document by id
            { $set: { name, designation, email, contact } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('Contact not found');
        }

        res.status(200).send('Contact updated successfully');
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/api/contacts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await contactsCollection.deleteOne({ id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.status(204).send(); // No content response
    } catch (error) {
        console.error('Failed to delete contact:', error);
        res.status(500).json({ message: 'Failed to delete contact' });
    }
});



app.post('/notice', async (req, res) => {
    const body = req.body;

    if (!body.content) {
        return res.status(400).json({ message: 'Content is required' });
    }
    const content = body.content;
    const id = body.id;

    // Date and Time formatting inside app.post
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNotice = {
        id,
        content,
        createdAt: formattedDate,
        createdTime: formattedTime,
    };

    try {
        const result = await noticeCollection.insertOne(newNotice);
        res.status(201).json({ message: 'Notice created successfully', noticeId: result.insertedId });
    } catch (error) {
        console.error('Error inserting notice:', error);
        res.status(500).json({ message: 'Error creating notice' });
    }
});



app.get('/notice', async (req, res) => {
    try {
        const notices = await noticeCollection.find().toArray();
        res.status(200).json({ notices });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ message: 'Error fetching notices' });
    }
});

app.put('/notice/:id', async (req, res) => {
    const { id } = req.params; // Get the notice ID from the URL parameters
    const { content } = req.body; // Get the content from the request body

    // Validate the input
    if (!content) {
        return res.status(400).json({ message: 'Content is required to update the notice' });
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
        // Update the notice in the database
        const result = await noticeCollection.updateOne(
            { id: id }, // Match the notice by ID
            {
                $set: {
                    content,
                    createdAt: formattedDate,  // Update the createdAt field
                    createdTime: formattedTime  // Update the createdTime field
                }
            }
        );

        // Check if a notice was matched and updated
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        // Optionally fetch the updated notice if you want to return it
        const updatedNotice = await noticeCollection.findOne({ id: id });
        res.status(200).json({
            message: 'Notice updated successfully',
            notice: updatedNotice, // Return the updated notice
        });
    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ message: 'Error updating notice', error: error.message });
    }
});
app.delete('/notice/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await noticeCollection.deleteOne({ id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        res.status(204).send(); // No content response
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ message: 'Error deleting notice' });
    }
});


app.get('/api/students/count', async (req, res) => {
    try {
        const count = await collection.countDocuments({});
        console.log(count);
        res.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get total students count" });
    }
});

// Endpoint to get inactive students count
app.get('/api/students/inactiveCount', async (req, res) => {
    try {
        const count = await collection.countDocuments({ status: 'active' });
        res.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get inactive students count" });
    }
});

// Endpoint to get total buses count
app.get('/api/buses/count', async (req, res) => {
    try {
        const count = await busDetails.countDocuments({});
        res.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get total buses count" });
    }
});

// Endpoint to get live buses count
app.get('/api/buses/liveCount', async (req, res) => {
    try {
        const count = await busDetails.countDocuments({});
        res.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get live buses count" });
    }
});


// POST /feedback - Create a new feedback entry
app.get('/api/feedback', async (req, res) => {
    try {
        const result = await db.collection('feedback')
            .find({})
            .sort({
                // Sorting by date and then by time. 
                // Adjust the fields as necessary based on your data structure.
                date: -1, // Ascending order (change to -1 for descending)
                time: -1  // Ascending order (change to -1 for descending)
            })
            .toArray();

        res.status(200).json({ result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not fetch feedback' });
    }
});


// POST /feedback/:id/reply - Add a reply to a feedback entry

app.post('/api/feedback/reply', async (req, res) => {
    const { feedbackId, replyText } = req.body;
    console.log(feedbackId, replyText);

    // Basic validation
    if (!feedbackId || !replyText) {
        return res.status(400).json({ success: false, message: "Feedback ID and reply text are required." });
    }

    // Find the feedback by ID
    const feedbacks = await feedback.findOne({ id: feedbackId });
    if (!feedbacks) {
        return res.status(404).json({ success: false, message: "Feedback not found." });
    }

    // Get the current date and time in IST
    const now = new Date();
    const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' };

    // Format date
    const formattedDate = new Intl.DateTimeFormat('en-IN', optionsDate).format(now);
    // Format time
    const formattedTime = new Intl.DateTimeFormat('en-IN', optionsTime).format(now);

    // Update the feedback with the reply
    const reply = {
        user: 'Admin', // Assuming you have the user info available
        text: replyText,
        date: formattedDate, // dd-mm-yyyy format
        time: formattedTime   // hh:mm format
    };

    const result = await feedback.updateOne(
        { id: feedbackId }, // Match the notice by ID
        {
            $set: {
                reply: { reply }
            }
        }
    );

    // Check if a notice was matched and updated
    if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Notice not found' });
    }

    // Respond with success
    res.json({ success: true, message: "Reply added successfully." });
});

app.post('/api/feedback', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const user = body.user;
    const text = body.text;
    console.log(body);
    if (!user || !text) {
        return res.status(400).json({ message: 'User and text are required' });
    }

    // Get current date and time in IST (Indian Standard Time)
    const now = new Date();
    const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24-hour format
    };

    const dateFormatter = new Intl.DateTimeFormat('en-IN', options);

    // Formatting date as dd-mm-yyyy
    const [datePart] = dateFormatter.format(now).split(',');
    const [day, month, year] = datePart.split('/'); // assuming it returns day/month/year format
    const formattedDate = `${day}-${month}-${year}`; // dd-mm-yyyy format

    // Formatting time as HH:MM
    const formattedTime = dateFormatter.format(now).split(',')[1].trim().substring(0, 5); // Extracting HH:MM

    // Create new feedback object
    const newFeedback = {
        id, // Generate a new UUID for the feedback
        user,
        text,
        date: formattedDate,
        time: formattedTime,
        reply: [] // Initialize reply as an empty array
    };

    try {
        // Insert the new feedback into the MongoDB collection
        const result = await feedback.insertOne(newFeedback);

        // Send response
        res.status(201).json({ message: 'Feedback added successfully', feedback: newFeedback });
    } catch (error) {
        console.error('Error inserting feedback:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/send-email', async (req, res) => {
    try {
        // const { enrollment, to, subject, text } = req.body;
        const body = req.body;
        if (body.enrollment) {
            const user = await collection.findOne({ enrollment:body.enrollment, email: body.to });
            // console.log(user);

            if (!user) {
                return res.status(404).json({ message: 'invalid user' });
            }
        }
        if(body.userType){
            const user = await collection.findOne({ userType:body.userType, email: body.to });
            // console.log(user);

            if (!user) {
                return res.status(404).json({ message: 'invalid user' });
            }
        }
        // Create a transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for port 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });


        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: body.to,
            subject: body.subject,
            text: body.text
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});



app.post('/api/changepassword', async (req, res) => {
    const body = req.body;

    try {
        // Connect to the MongoDB client

        // Find the user by email
        const user = await collection.findOne({ email: body.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare the old password with the stored hashed password
        if (body.oldPassword) {
            const isMatch = await bcrypt.compare(body.oldPassword, user.password);

            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect old password' });
            }
        }
        // Hash the new password
        if (!body.oldPassword && !body.forgot) {
            return res.status(400).json({ error: 'Incorrect access' });
        }
        const hashedNewPassword = await bcrypt.hash(body.newPassword, 10);

        // Update the user's password with the new hashed password
        await collection.updateOne(
            { email: body.email },
            { $set: { password: hashedNewPassword } }
        );

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

app.post('/feedetails', async (req, res) => {
    const body = req.body;
    console.log("enrollment",body);
    try {
        const fee = await fees.find({ enrollment: body.enrollment }).toArray();
        if (fee.length > 0) {
            res.status(200).send({ success: true, message: 'Data fetched', fee });
        } else {
            res.status(404).json({ success: false, message: 'No data found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

app.get('/show-bus-location', (req, res) => {
    const { latitude, longitude } = req.query;
  
    // Validate latitude and longitude
    if (!latitude || !longitude) {
      return res.status(400).send('Latitude and longitude are required');
    }
  
    // Serve the HTML page with map
    res.send(`
      <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bus Location on OpenStreetMap</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"/>
    <style>
      #map {
        width: 100%;
        height: 500px;
        border: 1px solid #ddd;
      }
    </style>
    <!-- Load Leaflet JS after Leaflet CSS -->
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
  </head>
  <body>
  
    <h1>Bus Location</h1>
    <div id="map"></div>
  
    <script>
      // Wait for the DOM to fully load before running the map initialization code
      document.addEventListener('DOMContentLoaded', () => {
        // Initialize the map and set view to the bus location coordinates
        const map = L.map('map').setView([${latitude}, ${longitude}], 15); // latitude, longitude, zoom level
  
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
  
        // Add a marker at the bus location
        L.marker([${latitude}, ${longitude}]).addTo(map)
          .bindPopup('Bus Location')
          .openPopup();
      });
    </script>
  
  </body>
  </html>
  
    `);
  });

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
