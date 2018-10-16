const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const JSZip = require('jszip');
const tar = require('tar-fs');
const fs = require('fs');
const exec = require('child_process').exec;
const Json = require('json');
const targz = require('targz');
const recursive = require('recursive-readdir');
const unzip = require('unzip');

const User = require('../models/user');
const Chat = require('../models/chat');

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
	res.render('index');
});

router.get('/doChat', (req, res, next) => {
	const room = req.query.room;
	const message = req.query.msg;
	const userId = req.query.user;
	
   console.log('asd!!!!!!!');
	

	const chat = new Chat({ room: room, message: message, userId: userId });

	chat.save((err, user) => {
		if (err) return console.error(err);
	});
});

router.get('/ChatRecord', (req, res, next) => {
	const room = req.query.room;

	const chat = [];
	const user = [];

	Chat.find((err, chat) => {
		if (err) return console.error(err);

		return res.json(chat);
	});
});

router.get('/userCheck', (req, res, next) => {
	const id = req.query.userId;
	const pw = req.query.userPw;

	User.findOne({ userId: id, userPw: pw }, (err, result) => {
		if (err) {
			return console.log(err);
		}

		if (result) {
			req.session.userId = id;
			res.send('success');
		} else {
			res.send('fail');
		}
	});
});

router.get('/chat', (req, res, next) => {
	if (!req.session.userId) {
		return res.redirect('/');
	}

	res.render('chat', { userId: req.session.userId });
});

router.get('/addUser', (req, res, next) => {
	res.render('addUser');
});

router.get('/fileManage', (req, res, next) => {
	if (!req.session.userId) {
		return res.redirect('/');
	}

	res.render('fileManage', { fileName: '', userId: req.session.userId });
});

router.get('/header', (req, res, next) => {
	if (!req.session.userId) {
		return res.redirect('/');
	}

	res.render('header', { userId: req.session.userId });
});

router.get('/getFileContents', (req, res, next) => {
	const file = req.query.file;

	fs.readFile(file, 'utf-8', function(error, text) {
		res.send(text);
	});
});

router.get('/logout', (req, res, next) => {
	req.session.destroy();
	res.redirect('/');
});

router.get('/updateFileContents', (req, res, next) => {
	// 파일내용을 수정

	const code = req.query.code;
	const file = req.query.file;

	fs.writeFile(file, code, 'utf-8', function(e) {
		if (e) {
			console.log(e);
		} else {
		}
	});
});

router.get('/getSubFiles', (req, res, next) => {
	const fileName = `./uploads/${req.query.fileName}`;
	const originFileName = req.query.fileName;
	let dir;

	if (originFileName.includes('.zip')) {
		dir = `${process.env.PWD}/uploads/${originFileName.slice(0, originFileName.length - 4)}`;

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir); // 파일들을 저장할 폴더를 생성
			fs
				.createReadStream(`${process.env.PWD}/uploads/${originFileName}`)
				.pipe(unzip.Extract({ path: dir })); // 압축해제
		}

		if (fs.existsSync(dir)) {
			recursive(dir, (err, files) => {
				res.json(files);
			});
		}
	} else if (originFileName.includes('.tar')) {
		dir = `${process.env.PWD}/uploads/${originFileName.slice(0, originFileName.length - 4)}`; //  파일들을 저장할 폴더명
		
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir); // 파일들을 저장할 폴더를 생성

			fs.createReadStream(`./uploads/${originFileName}`).pipe(tar.extract(dir));
			
			
			// targz.decompress(         // 파일이 tar.gz인 경우
			// 	// tar파일내의 파일들을 dir폴더에 저장
			// 	{
			// 		src: `./uploads/${originFileName}`,
			// 		dest: `${dir}`
			// 	},
			// 	err => {
			// 		if (err) {
			// 			console.log(err);
			// 		}
			// 	}
			// );
		}

		if (fs.existsSync(dir)) {
			
			recursive(dir, (err, files) => {
				res.json(files);
			});
		}
	}
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads/');
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

const upload = multer({ storage: storage });

router.post('/uploads', upload.single('userfile'), (req, res) => {
	res.render('fileManage', { fileName: req.file.filename, userId: req.session.userId });
});

router.post('/addUser', (req, res) => {
	const userId = req.body.userId;
	const userPw = req.body.userPw;

	const user = new User({ userId: userId, userPw: userPw });

	user.save((err, user) => {
		if (err) return console.error(err);
	});

	res.redirect('/');
});

module.exports = router;