import bcrypt from 'bcryptjs';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { generateTemporaryPassword } from '@/lib/utils/password';
import {
  createCompanyStripeAccount,
  rollbackStripeAccount,
} from '@/lib/services/stripe/companyStripe';
import { sendCompanyCredentialsEmail } from '@/lib/mail/sendCompanyCredentialsEmail';

type OnboardCompanyInput = {
  name: string;
  email: string;
  maintenancePercent: number;
};

export async function onboardCompany(input: OnboardCompanyInput) {
  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const user = await UserRepository.create({
    email: input.email,
    password: hashedPassword,
    name: input.name,
    role: 'COMPANY',
    emailVerified: true,
    mustChangePassword: true,
  } as any);

  let company: any = null;
  let stripeAccountId: string | null = null;

  try {
    stripeAccountId = await createCompanyStripeAccount({
      email: input.email,
      companyName: input.name,
    });

    company = await CompanyRepository.create({
      ownerId: user.id,
      name: input.name,
      email: input.email,
      maintenancePercent: input.maintenancePercent,
      stripeAccountId,
    } as any);

    if ((user as any).companyId !== company.id) {
      await UserRepository.update(user.id, {
        companyId: company.id,
        mustChangePassword: true,
      } as any);
    }

    const mailInfo = await sendCompanyCredentialsEmail({
      to: input.email,
      companyName: input.name,
      loginEmail: input.email,
      temporaryPassword,
    });

    return { company, mailInfo };
  } catch (err) {
    if (company?.id) {
      try {
        await CompanyRepository.delete(company.id);
      } catch (companyRollbackErr) {
        console.warn('Company rollback failed:', companyRollbackErr);
      }
    }

    try {
      await UserRepository.delete(user.id);
    } catch (userRollbackErr) {
      console.warn('User rollback failed:', userRollbackErr);
    }

    if (stripeAccountId) {
      await rollbackStripeAccount(stripeAccountId);
    }

    throw err;
  }
}
