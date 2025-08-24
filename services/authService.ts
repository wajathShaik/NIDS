
import type { User, Role, Department, UserStatus } from '../types';
import { Role as RoleEnum, UserStatus as UserStatusEnum, Department as DeptEnum, LogAction } from '../types';
import { inboxService } from './inboxService';
import { otpService } from './otpService';
import { logService } from './logService';


const USERS_KEY = 'nids_xai_users';

const getUsersFromStorage = (): any[] => {
    const usersJSON = localStorage.getItem(USERS_KEY);
    return usersJSON ? JSON.parse(usersJSON) : [];
};

const saveUsersToStorage = (users: any[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const generateRandomPassword = (): string => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = upper + lower + numbers + symbols;
    let password = '';
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 0; i < 8; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Initializes default admin if not present
(() => {
    const users = getUsersFromStorage();
    const adminEmail = 'shaikhussain098098@gmail.com';
    if (!users.some((u: any) => u.email === adminEmail)) {
        users.push({
            id: 'admin-user-sec-01',
            email: adminEmail,
            personalEmail: 'admin.personal@example.com',
            password: 'XaiNidsEnterpriseAdmin!@2024',
            role: RoleEnum.Admin,
            status: UserStatusEnum.Active,
            department: DeptEnum.SOC,
        });
        saveUsersToStorage(users);
    }
})();

const notifyAdminsOfPrivilegedAction = async (actingAdmin: User, targetUser: { email: string }, action: string, reason: string) => {
    const users = getUsersFromStorage();
    const adminsAndManagers = users.filter(u =>
        u.id !== actingAdmin.id && // Don't notify the admin who performed the action
        (u.role === RoleEnum.Admin || u.role === RoleEnum.SecurityManager)
    );

    for (const recipient of adminsAndManagers) {
        await inboxService.sendMessage({
            toUserId: recipient.id,
            from: 'System Security Monitor',
            subject: `PRIVILEGED ACTION ALERT: ${action}`,
            body: `
                <p>An administrative action was just performed on the platform. Please review for legitimacy.</p>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Action Performed:</strong> ${action}</li>
                    <li><strong>Target User:</strong> ${targetUser.email}</li>
                    <li><strong>Performed By:</strong> ${actingAdmin.email}</li>
                    <li><strong>Provided Reason:</strong> <em>${reason}</em></li>
                </ul>
            `
        });
    }
};

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const users = getUsersFromStorage();
    const userRecord = users.find((u) => u.email === email && u.password === password);
    
    if (userRecord) {
      const { password, ...sessionUser } = userRecord;
      return sessionUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
      throw new Error('Invalid email or password');
    }
  },

  logout(): void {
    return;
  },
  
  async register(email: string, password: string): Promise<User> {
    const users = getUsersFromStorage();
    if (users.some((u) => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    const newUserRecord = {
      id: `user-${Date.now()}`,
      email,
      personalEmail: email, // For self-registration, personal and work emails are the same
      password: password,
      role: RoleEnum.ReadOnly,
      status: UserStatusEnum.Pending,
      department: DeptEnum.Unassigned,
    };
    
    users.push(newUserRecord);
    saveUsersToStorage(users);
    
    await logService.addLog({
        action: LogAction.USER_REGISTERED,
        userEmail: email,
        userId: newUserRecord.id
    });

    const { password: _, ...newUser } = newUserRecord;
    return newUser;
  },
  
  async verifyAccount(email: string, otp: string): Promise<void> {
    const isValid = await otpService.verifyOtp(email, otp);
    if (!isValid) {
        throw new Error("Invalid or expired OTP.");
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.email === email);

    if (userRecord && userRecord.status === UserStatusEnum.Active) {
        await otpService.generateOtp(email);
    }
    // Don't throw to prevent email enumeration.
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const isValid = await otpService.verifyOtp(email, otp);
    if (!isValid) {
        throw new Error("Invalid or expired OTP.");
    }
    
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.email === email);

    if (!userRecord) {
        throw new Error("User not found.");
    }

    userRecord.password = newPassword;
    saveUsersToStorage(users);
  },

  // --- Admin Functions ---
  async getUsers(): Promise<User[]> {
    const users = getUsersFromStorage();
    return users.map(({ password, ...userAttrs }) => userAttrs);
  },

  async createUser(email: string, personalEmail: string, role: Role, department: Department, adminUser: User): Promise<User> {
    const users = getUsersFromStorage();
    if (users.some((u) => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    const newPassword = generateRandomPassword();
    const newUserRecord = {
      id: `user-${Date.now()}`,
      email,
      personalEmail,
      password: newPassword,
      role,
      status: UserStatusEnum.Active,
      department,
    };
    
    users.push(newUserRecord);
    saveUsersToStorage(users);

    await inboxService.sendMessage({
        toUserId: adminUser.id,
        from: 'System Notification',
        subject: `User Account Created: ${newUserRecord.email}`,
        body: `You have successfully created an account for <strong>${newUserRecord.email}</strong>.
               <br/><br/>
               A welcome message with their temporary password has been sent to their personal email address: <strong>${personalEmail}</strong>.`
    });

    const { password, ...newUser } = newUserRecord;
    return newUser;
  },
  
  async adminResetPassword(userId: string, adminUser: User, reason: string): Promise<void> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.id === userId);
    if (!userRecord) {
      throw new Error("User not found.");
    }
    
    const newPassword = generateRandomPassword();
    userRecord.password = newPassword;
    saveUsersToStorage(users);

     await inboxService.sendMessage({
        toUserId: adminUser.id,
        from: 'System Notification',
        subject: `Password Reset for ${userRecord.email}`,
        body: `As requested, the password for <strong>${userRecord.email}</strong> has been reset based on the following reason: <em>"${reason}"</em>.
               <br/><br/>
               A notification with the new password has been sent to their personal email: <strong>${userRecord.personalEmail}</strong>.`
    });

    await notifyAdminsOfPrivilegedAction(adminUser, userRecord, `Password Reset`, reason);
  },

  async userChangePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.id === userId);
    if (!userRecord || userRecord.password !== oldPassword) {
      throw new Error("Incorrect old password.");
    }
    userRecord.password = newPassword;
    saveUsersToStorage(users);
  },

  async updateUserStatus(userId: string, status: UserStatus, adminUser: User, reason: string): Promise<User> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.id === userId);
    if (!userRecord) throw new Error("User not found");
    userRecord.status = status;
    saveUsersToStorage(users);

    await notifyAdminsOfPrivilegedAction(adminUser, userRecord, `Status changed to ${status}`, reason);
    
    const { password, ...userAttrs } = userRecord;
    return userAttrs;
  },

  async updateUserRole(userId: string, role: Role, adminUser: User, reason: string): Promise<User> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.id === userId);
    if (!userRecord) throw new Error("User not found");
    userRecord.role = role;
    saveUsersToStorage(users);
    
    await notifyAdminsOfPrivilegedAction(adminUser, userRecord, `Role changed to ${role}`, reason);

    const { password, ...userAttrs } = userRecord;
    return userAttrs;
  },

  async updateUserDepartment(userId: string, department: Department, adminUser: User, reason: string): Promise<User> {
    const users = getUsersFromStorage();
    const userRecord = users.find(u => u.id === userId);
    if (!userRecord) throw new Error("User not found");
    userRecord.department = department;
    saveUsersToStorage(users);
    
    await notifyAdminsOfPrivilegedAction(adminUser, userRecord, `Department changed to ${department}`, reason);

    const { password, ...userAttrs } = userRecord;
    return userAttrs;
  }
};
