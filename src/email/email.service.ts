import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}
  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }

  async sendEmail(dto: EmailDto) {
    const transporter = this.emailTransport();

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: dto.recipients,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Email sent successfully' };
    } catch (error) {
      throw new Error(`Failed to send email: ${error?.message ?? error}`);
    }
  }

  async sendActivationEmail(email: string, token: string) {
    const activationUrl = `${this.configService.get<string>('FRONT_END_URL')}/activate?token=${token}`;

    // Using nodemailer example
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Activate Your Account',
      html: `
        <h2>Welcome!</h2>
        <p>Click the link below to activate your account:</p>
        <a href="${activationUrl}">Activate Account</a>
        <p>This link expires in 24 hours.</p>
      `,
    };

    const transporter = this.emailTransport();
    await transporter.sendMail(mailOptions);
  }
}
