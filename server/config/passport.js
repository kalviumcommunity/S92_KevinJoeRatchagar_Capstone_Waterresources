const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Enable Google login only when credentials are configured.
if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
) {
    passport.use(
        new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async(accessToken, refreshToken, profile, done) => {
                try {
                    const email =
                        profile.emails && profile.emails.length > 0 ?
                        profile.emails[0].value :
                        "";

                    let user = await User.findOne({
                        googleId: profile.id,
                    });

                    if (!user && email) {
                        user = await User.findOne({ email });
                    }

                    if (user) {
                        user.googleId = profile.id;
                        user.profileImage =
                            profile.photos && profile.photos.length > 0 ?
                            profile.photos[0].value :
                            user.profileImage;
                        user.authProvider = "google";

                        await user.save();
                        return done(null, user);
                    }

                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email,
                        profileImage: profile.photos && profile.photos.length > 0 ?
                            profile.photos[0].value : "",
                        authProvider: "google",
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Google authentication error:", error);
                    return done(error, null);
                }
            }
        )
    );

    console.log("Google OAuth configured.");
} else {
    console.warn(
        "Google OAuth disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing."
    );
}

module.exports = passport;