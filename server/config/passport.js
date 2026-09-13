const passport = require("passport");
const GoogleStrategy =
    require("passport-google-oauth20").Strategy;

const User = require("../models/User");

// =====================================================
// GOOGLE STRATEGY
// =====================================================

passport.use(
    new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,

            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },

        async(
            accessToken,
            refreshToken,
            profile,
            done
        ) => {
            try {
                // Get Google email
                const email =
                    profile.emails &&
                    profile.emails.length > 0 ?
                    profile.emails[0].value :
                    "";

                // First search by Google ID
                let user =
                    await User.findOne({
                        googleId: profile.id,
                    });

                // If not found, search by email
                if (!user && email) {
                    user =
                        await User.findOne({
                            email,
                        });
                }

                // Existing user
                if (user) {
                    user.googleId =
                        profile.id;

                    user.profileImage =
                        profile.photos &&
                        profile.photos.length > 0 ?
                        profile.photos[0].value :
                        user.profileImage;

                    user.authProvider =
                        "google";

                    await user.save();

                    return done(null, user);
                }

                // Create new Google user
                user =
                    await User.create({
                        googleId: profile.id,

                        name: profile.displayName,

                        email,

                        profileImage: profile.photos &&
                            profile.photos.length > 0 ?
                            profile.photos[0].value : "",

                        authProvider: "google",
                    });

                return done(null, user);
            } catch (error) {
                console.error(
                    "Google authentication error:",
                    error
                );

                return done(
                    error,
                    null
                );
            }
        }
    )
);

module.exports = passport;