import { createUserRepository } from '../../backend/shared/domain/userRepository';
import type { UserRepository } from '../../backend/shared/domain/userRepository';

let userRepository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = createUserRepository();
  }
  return userRepository;
}
