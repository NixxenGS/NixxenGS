plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Release signing: CI secrets win when present (see README); otherwise the
// sideload keystore checked into keystore/ keeps every build installable over
// the previous one.
val ksFile = System.getenv("HH_KEYSTORE_FILE")?.let { file(it) } ?: rootProject.file("keystore/sideload.jks")
val ksPassword = System.getenv("HH_KEYSTORE_PASSWORD") ?: "hhcompanion"
val ksAlias = System.getenv("HH_KEY_ALIAS") ?: "hhcompanion"
val ksKeyPassword = System.getenv("HH_KEY_PASSWORD") ?: ksPassword

val buildNumber = (project.findProperty("buildNumber") as String?)?.toIntOrNull() ?: 1

android {
    namespace = "com.nixxengs.hhcompanion"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nixxengs.hhcompanion"
        minSdk = 26
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        create("release") {
            storeFile = ksFile
            storePassword = ksPassword
            keyAlias = ksAlias
            keyPassword = ksKeyPassword
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    androidResources {
        // index.html is already self-contained; keep it byte-for-byte.
        noCompress += listOf("html", "js")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}
