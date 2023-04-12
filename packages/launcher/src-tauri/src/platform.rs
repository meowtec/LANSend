use std::path::PathBuf;
use tauri::Config;

pub fn get_app_data_dir(config: &Config) -> Result<PathBuf, anyhow::Error> {
    #[cfg(target_os = "android")]
    {
        let ctx = ndk_context::android_context();
        let vm = unsafe { jni::JavaVM::from_raw(ctx.vm().cast()) }?;
        let env = vm.attach_current_thread()?;

        let context = unsafe { jni::objects::JObject::from_raw(ctx.context().cast()) };

        let dir = env
            .call_method(context, "getFilesDir", "()Ljava/io/File;", &[])?
            .l()?;

        let dir_str = env.get_string(
            env.call_method(dir, "getAbsolutePath", "()Ljava/lang/String;", &[])?
                .l()?
                .into(),
        )?;

        Ok(PathBuf::from(dir_str.to_str()?))
    }

    #[cfg(not(target_os = "android"))]
    {
        tauri::api::path::app_data_dir(config).map_or(Err(anyhow::anyhow!("no data dir")), Ok)
    }
}
