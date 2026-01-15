import nodemailer from 'nodemailer'

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  /**
   * Инициализация транспорта для отправки email
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Если SMTP не настроен, используем тестовый аккаунт или консольный вывод
    const useTestAccount = !process.env.SMTP_HOST

    if (useTestAccount) {
      // Пытаемся создать тестовый аккаунт Ethereal для разработки
      try {
        const testAccount = await nodemailer.createTestAccount()
        console.log('📧 Using Ethereal Email for testing')
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
      } catch (error) {
        // Если не удалось создать тестовый аккаунт, используем фейковый транспортер
        console.log('⚠️  SMTP not configured, verification codes will be logged to console')
        this.transporter = {
          sendMail: async (mailOptions: any) => {
            // В режиме разработки просто выводим код в консоль
            console.log('\n📧 EMAIL (Dev Mode):')
            console.log('To:', mailOptions.to)
            console.log('Subject:', mailOptions.subject)
            console.log('Code:', mailOptions.text.match(/\d{6}/)?.[0] || 'N/A')
            console.log('---\n')
            return { messageId: 'dev-mode-' + Date.now() }
          },
        } as any
      }
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }

    return this.transporter as unknown as nodemailer.Transporter
  }

  /**
   * Отправка кода подтверждения
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    const transporter = await this.getTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 15 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('✅ Verification code sent to', email)

      // В режиме разработки выводим ссылку на просмотр email (для Ethereal)
      if (info.messageId && nodemailer.getTestMessageUrl) {
        const testUrl = nodemailer.getTestMessageUrl(info)
        if (testUrl) {
          console.log('📧 Preview URL:', testUrl)
        }
      }
    } catch (error: any) {
      console.error('❌ Error sending email:', error)
      throw error
    }
  }
}

export const emailService = new EmailService()
