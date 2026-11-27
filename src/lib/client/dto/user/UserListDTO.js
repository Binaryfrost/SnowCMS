import PaginatedDTO from '../PaginatedDTO.js';
import UserDTO from './UserDTO.js';

export default class UserListDTO extends PaginatedDTO {
  #users;

  /**
   * @param {number} page
   * @param {number} pages
   * @param {UserDTO[]} users
   */
  constructor(page, pages, users) {
    super(page, pages);
    this.#users = users;
  }

  get users() {
    return this.#users;
  }

  clone() {
    return new UserListDTO(
      this._metadata.page,
      this._metadata.pages,
      this.users
    );
  }

  static fromJSON(json) {
    return new UserListDTO(
      json._metadata.page,
      json._metadata.pages,
      json.users.map(({
        id, email, role, active, websites
      }) => new UserDTO(id, email, role, active, websites))
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      users: this.users.map((user) => user.toJSON())
    };
  }
}
