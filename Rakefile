require "zipruby"
require "closure-compiler"

def min
  puts "Compressing JS with closure-compiler"
  closure = Closure::Compiler.new(:compilation_level => 'ADVANCED_OPTIMIZATIONS')
  code = closure.compile(File.open("lib/meisterhirn.js", "r").read + File.open("app.js", "r").read)
  file = File.new("tmp/minimized.js", "w")
  file.write(code)
  file.close
end

def encrypt
  puts "Encrypting file"
  sh "node encrypt.js tmp/minimized.js tmp/encrypted.js"
end

def fromtpl
  puts "Building site from tpl"
  tpl = File.open("index.html.tpl", "r").read
  js  = File.open("tmp/encrypted.js", "r").read
  js.gsub!("'") { "\\'" }
  js.gsub!("\n", "")
  tpl = tpl.split("{{js}}").join(js)
  file = File.new("output/index.html", "w")
  file.write(tpl)
  file.close
  sh "cp cache.manifest output/c.manifest"
end

def zip
  Zip::Archive.open("output.zip", Zip::CREATE) do |ar|
    ar.add_or_replace_file("output/index.html")
    ar.add_or_replace_file("output/c.manifest")
  end
end

def printsize
  puts "Total size: " + (File.size("output/index.html") + File.size("output/c.manifest")).to_s
end

task "10k".to_sym do
  sh "mkdir -p tmp"
  sh "mkdir -p output"
  min
  encrypt
  fromtpl
  zip
  printsize
end
