import { HttpException, HttpStatus, Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FinancialsModule } from 'src/financials/financials.module';

@Module({
  imports: [
    FinancialsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/masters',
        filename: (req, file, callback) => {
          const name = req.body.fullName || 'unknown-user';
          const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
          const uniqueSuffix = Date.now();
          const fileExt = extname(file.originalname);
          const finalFileName = `${sanitizedName}-${uniqueSuffix}${fileExt}`;
          callback(null, finalFileName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
          return callback(
            new HttpException(
              'فقط فایل های تصویری (jepg, png, webp, jpg) مجاز هستند',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 1 },
    }),
  ],
  controllers: [MasterController],
  providers: [MasterService],
  exports: [MasterService],
})
export class MasterModule {}
