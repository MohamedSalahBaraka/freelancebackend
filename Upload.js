import multer, { diskStorage } from 'multer';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        let extention = file.originalname.split('.');
        extention = extention[extention.length - 1];
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extention)
    }
})

export const upload = multer({ storage: storage }).single('photo')

