# LTP - Lego Telepresence

For this to work, we need to make some modifications to [next-ws](https://github.com/apteryxxyz/next-ws) as the canary version of NextJS (v15) is supported but blocked by ``next-ws``' support check.

To do this, we need to do the following:
 1. Run the patch command specified by ``next-ws``:
    ```bash
        npx next-ws-cli@latest patch
    ```
    If you're doing this while the v15 version is not officially supported, the command above should fail at the support checking, else, you can stop following this guide.
 2. Now, the ``next-ws-cli`` utility has been installed on our system. We now have to locate where the code for ``next-ws-cli`` is located.
    Mine was located at ``/home/user/.npm/_npx/34bf92ee021717b3/node_modules/next-ws-cli/dist``, but the location may vary on your system.

    To easily find where this is located, you can run a search on your computer for "next-ws-cli", or you can Google the location for NPX downloads on your system.
 3. We should now see a file called ``program.cjs``. Open it up in your favorite text editor.
 4. In the file, search for ``src/patches/patch-3.ts``. As it takes you to where that string is located, you will see an object (``{}``), containing the properties "``date``" and "``supported``".
 5. In "``supported``" change the value after ``<=`` to be ``16.0.0``. The "``supported``" should now consist of the following text: "``>=13.5.1 <=16.0.0``"
 6. Save the file and re-run the command in the first step.

**Note:** When installing ``next-ws`` and ``ws``, you might get an error about dependency conflicts, to resolve this issue, re-run the install command with ``--force`` at the end.
