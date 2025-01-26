module.exports = (sequelize, DataTypes) => {
    const Player = sequelize.define('Player', {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Enforce unique usernames
      },
      positionX: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      positionY: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      positionZ: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      health: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
      },
      inventory: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    });
  
    return Player;
  };