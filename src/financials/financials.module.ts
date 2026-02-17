import { forwardRef, Module } from '@nestjs/common';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/receipt',
        filename: (req, file, callback) => {
          const name = req.body.payerFullName || 'unknown-user';
          const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
          const uniqueSuffix = Date.now();
          const fileExt = extname(file.originalname);
          const finalFileName = `${sanitizedName}-${uniqueSuffix}${fileExt}`;
          callback(null, finalFileName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new Error('فقط فایل های تصویری (jepg, png, webp, jpg) مجاز هستند'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
  ],
  controllers: [FinancialsController],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
